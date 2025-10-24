# ADR-005: User Preferences Storage Mechanism

## Status
✅ **ACCEPTED** - 2025-10-24

## Context

### Problem Statement
The Autos2 application needs to store user preferences (theme, language, dashboard layout, search filters, etc.) with the following requirements:

**Functional Requirements**:
- Store arbitrary key-value pairs (theme, language, notifications, dashboard settings, etc.)
- Support schema evolution (add new preference keys without database migration)
- Persist across sessions and devices
- Provide default preferences for new users

**Non-Functional Requirements**:
- **Performance**: Read latency <100ms (p95)
- **Performance**: Write latency <500ms (p95)
- **Scalability**: Support 10,000+ concurrent users
- **Availability**: 99.9% uptime
- **Consistency**: Changes sync across devices within 5 seconds
- **Cost**: Minimize additional infrastructure costs

### Constraints
- Must integrate with existing PostgreSQL database (vehicle data)
- Team expertise: PostgreSQL, Node.js, TypeScript, Angular
- Budget: Prefer $0 additional infrastructure
- Deployment: Kubernetes cluster (k3s)
- Current scale: <1,000 users initially, planning for 10,000+

### Business Context
User preferences improve user experience and reduce support requests by:
- Remembering user choices (theme, layout)
- Faster workflows (saved search filters)
- Personalization (dashboard widgets)

---

## Decision

We will use **PostgreSQL with a JSONB column** in the existing `users` table to store user preferences.

### Schema Design
```sql
-- Add preferences column to existing users table
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for fast queries on JSONB
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Add audit timestamp
ALTER TABLE users ADD COLUMN preferences_updated_at TIMESTAMP DEFAULT NOW();
```

### API Design
```typescript
// GET /api/v1/users/{userId}/preferences
{
  "theme": "dark",
  "language": "en",
  "notifications": {
    "email": true,
    "push": false
  },
  "dashboard": {
    "layout": "grid",
    "widgets": ["stats", "chart"]
  },
  "search": {
    "resultsPerPage": 20,
    "defaultFilters": {}
  }
}

// PUT /api/v1/users/{userId}/preferences (partial update)
{
  "theme": "light"  // Only update theme, preserve other preferences
}
```

---

## Alternatives Considered

### Alternative 1: JSON Files on Filesystem ❌ REJECTED

**Approach**: Write one JSON file per user to a dedicated directory on the server.

**Pros**:
- Simple implementation (no database changes)
- Fast for small scale
- Schema-less (easy to add new keys)
- Easy to inspect/debug

**Cons**:
- **Concurrency Issues**: Race conditions with simultaneous writes from multiple browser tabs
- **No ACID Guarantees**: Risk of file corruption during write failures
- **Scaling Problems**: File system limits (millions of files), slow directory listing, inode exhaustion
- **Distributed Systems**: Cannot sync across multiple application servers
- **No Query Capability**: Cannot answer "How many users prefer dark mode?"
- **Security Risks**: File permissions, path traversal vulnerabilities
- **Backup Complexity**: Must coordinate backups with active writes

**Why Rejected**: Not production-ready. Acceptable for prototypes only. Fails scalability, concurrency, and reliability requirements.

---

### Alternative 2: Elasticsearch Index ❌ REJECTED

**Approach**: Store user preferences as documents in an Elasticsearch index.

**Pros**:
- Horizontal scaling (handle millions of users)
- Built-in replication and fault tolerance
- RESTful API
- Excellent analytics capability (aggregate preferences across users)
- Full-text search on preference values
- Document versioning

**Cons**:
- **Wrong Tool for the Job**: Elasticsearch is designed for search/analytics, not transactional user state
- **Overkill**: Too complex for simple key-value storage
- **Resource Intensive**: High memory/CPU usage
- **No ACID**: Eventual consistency may lose writes during node failures
- **Cost**: Requires ES cluster infrastructure
- **Write Performance**: Slower than traditional databases for updates
- **Operational Complexity**: Cluster management, index maintenance, version upgrades

**Why Rejected**: Elasticsearch solves a different problem (search/analytics). Using it for user preferences is architectural over-engineering. We already have Elasticsearch for vehicle search, but user preferences are not search data.

---

### Alternative 3: MongoDB Document Store ⚠️ DEFERRED

**Approach**: Create MongoDB collection with one document per user.

**Pros**:
- Document-oriented (natural fit for user preferences)
- Schema-less (flexible structure)
- Scales horizontally
- Good query capabilities
- JSON-native

**Cons**:
- **New Infrastructure**: Requires deploying and managing MongoDB
- **Team Expertise**: Team lacks MongoDB operational experience
- **Additional Complexity**: Another database to backup, monitor, secure
- **Cost**: Infrastructure for MongoDB cluster
- **Not ACID by Default**: Eventual consistency unless using transactions

**Why Rejected**: Adds unnecessary complexity. PostgreSQL with JSONB provides similar benefits without new infrastructure. Could reconsider if we adopt MongoDB for other features.

---

### Alternative 4: Redis Cache + PostgreSQL Persistence ⏸️ DEFERRED

**Approach**:
- Write preferences to PostgreSQL (source of truth)
- Cache in Redis for fast reads
- Implement write-through or write-behind caching

**Pros**:
- **Best Performance**: Sub-millisecond read latency
- **Scales Reads**: Infinite read scalability
- **ACID Persistence**: PostgreSQL as source of truth
- **Reduces DB Load**: Most reads served from cache

**Cons**:
- **Increased Complexity**: Two systems to manage
- **Cache Invalidation**: "One of the two hard problems in computer science"
- **Additional Infrastructure**: Redis cluster required
- **Cost**: Infrastructure and operational overhead
- **Development Time**: More complex implementation

**Why Deferred**: PostgreSQL alone meets performance requirements (<100ms). If production metrics show read latency exceeding 100ms, we can add Redis caching layer (see ADR-005.1 - Future Enhancement).

**Triggering Conditions for Reconsideration**:
- p95 read latency exceeds 100ms in production
- More than 1,000 concurrent users
- Preferences accessed >10 times per user session

---

### Alternative 5: PostgreSQL with JSONB Column ✅ SELECTED

**Approach**: Add `preferences JSONB` column to existing `users` table.

**Pros**:
- ✅ **Leverages Existing Infrastructure**: No new systems to deploy/manage
- ✅ **ACID Compliance**: Guarantees data consistency and durability
- ✅ **Schema-less**: JSONB stores arbitrary JSON, add keys without migration
- ✅ **Queryable**: GIN indexes enable fast queries on JSONB data
- ✅ **Team Expertise**: Team already knows PostgreSQL
- ✅ **Zero Additional Cost**: Uses existing database
- ✅ **Backup/Recovery**: Included in existing database backups
- ✅ **Meets Performance Requirements**: <100ms read latency achievable with GIN indexes
- ✅ **Partial Updates**: JSONB operators support merging (preserve unmodified keys)

**Cons**:
- ⚠️ **Slightly Slower Than Redis**: ~50-100ms vs ~1ms (but meets requirements)
- ⚠️ **Single Point of Failure**: If PostgreSQL is down, preferences unavailable (but entire app is down anyway)

**Why Selected**: Best balance of simplicity, cost, reliability, and performance. Meets all requirements without adding complexity.

---

## Consequences

### Positive Consequences

1. **Zero Infrastructure Cost**: No new systems to deploy, manage, or pay for
2. **Operational Simplicity**: One database to backup, monitor, and secure
3. **Team Velocity**: Team already comfortable with PostgreSQL
4. **Data Integrity**: ACID guarantees prevent preference loss or corruption
5. **Query Capability**: Can analyze preferences for product insights
   ```sql
   -- How many users prefer dark mode?
   SELECT COUNT(*) FROM users WHERE preferences->>'theme' = 'dark';
   ```
6. **Backup Strategy**: Preferences backed up with existing database backups
7. **Schema Evolution**: Add new preference keys without database migration
   ```typescript
   // Frontend can immediately start using new preference
   updatePreferences({ newFeature: { enabled: true } });
   ```

### Negative Consequences

1. **Read Latency**: ~50-100ms vs ~1ms for Redis (mitigation below)
2. **Database Load**: Preferences add to PostgreSQL query load (mitigation below)
3. **Single Database Dependency**: If PostgreSQL is slow, preferences are slow (acceptable - entire app depends on PostgreSQL)

### Mitigation Strategies

**Mitigation 1: Performance Monitoring**
```typescript
// Add monitoring for preference read latency
@Timed('preferences.read.duration')
async getPreferences(userId: string): Promise<UserPreferences> {
  const start = Date.now();
  const prefs = await this.db.query(...);
  const duration = Date.now() - start;

  if (duration > 100) {
    this.logger.warn(`Slow preference read: ${duration}ms for user ${userId}`);
  }

  return prefs;
}
```

**Mitigation 2: Database Query Optimization**
```sql
-- Use prepared statements for faster execution
PREPARE get_prefs (UUID) AS
  SELECT preferences FROM users WHERE user_id = $1;

-- Monitor slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%preferences%'
ORDER BY mean_exec_time DESC;
```

**Mitigation 3: Frontend Caching**
```typescript
// Cache preferences in localStorage for offline/fast access
private cacheLocally(prefs: UserPreferences): void {
  localStorage.setItem('userPreferences', JSON.stringify(prefs));
}

// Load from cache first, then sync with backend
loadPreferences(): Observable<UserPreferences> {
  const cached = this.loadFromLocalCache();
  this.preferencesSubject.next(cached);  // Immediate UI update

  return this.http.get(...).pipe(
    tap(serverPrefs => this.preferencesSubject.next(serverPrefs))
  );
}
```

**Mitigation 4: Future Redis Layer (If Needed)**
If production metrics show p95 latency >100ms:
- Create ADR-005.1 for Redis caching layer
- Implement write-through cache pattern
- Keep PostgreSQL as source of truth

---

## Implementation

### Phase 1: Database Schema (Week 1)

```sql
-- Migration: 2025-10-24-add-user-preferences.sql
BEGIN;

-- Add preferences column
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Add update timestamp
ALTER TABLE users ADD COLUMN preferences_updated_at TIMESTAMP DEFAULT NOW();

-- Create GIN index for fast JSONB queries
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Add trigger to update timestamp
CREATE OR REPLACE FUNCTION update_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.preferences_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_preferences_timestamp
BEFORE UPDATE OF preferences ON users
FOR EACH ROW
EXECUTE FUNCTION update_preferences_timestamp();

COMMIT;
```

### Phase 2: Backend API (Week 1)

```typescript
// services/user-preferences.service.ts
@Injectable()
export class UserPreferencesService {
  constructor(
    @Inject('DATABASE') private db: Pool,
    private logger: LoggerService
  ) { }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const result = await this.db.query(
      'SELECT preferences FROM users WHERE user_id = $1',
      [userId]
    );

    return result.rows[0]?.preferences || this.getDefaultPreferences();
  }

  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<void> {
    await this.db.query(
      `UPDATE users
       SET preferences = preferences || $1::jsonb
       WHERE user_id = $2`,
      [JSON.stringify(updates), userId]
    );

    this.logger.info(`Updated preferences for user ${userId}`);
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'en',
      notifications: { email: true, push: true, inApp: true },
      dashboard: { layout: 'grid', defaultView: 'home', widgets: [] },
      search: { resultsPerPage: 20, defaultFilters: {} }
    };
  }
}

// controllers/users.controller.ts
@Controller('api/v1/users')
export class UsersController {
  @Get(':userId/preferences')
  @UseGuards(AuthGuard)
  async getPreferences(@Param('userId') userId: string) {
    return this.prefsService.getPreferences(userId);
  }

  @Put(':userId/preferences')
  @UseGuards(AuthGuard)
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() updates: Partial<UserPreferences>
  ) {
    await this.prefsService.updatePreferences(userId, updates);
    return { success: true };
  }
}
```

### Phase 3: Angular Frontend Service (Week 2)

```typescript
// services/user-preferences.service.ts
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private preferencesSubject = new BehaviorSubject<UserPreferences>(DEFAULT_PREFERENCES);
  private saveQueue$ = new Subject<Partial<UserPreferences>>();

  preferences$ = this.preferencesSubject.asObservable();
  theme$ = this.preferences$.pipe(map(p => p.theme));
  language$ = this.preferences$.pipe(map(p => p.language));

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeAutoSave();
  }

  loadPreferences(): Observable<UserPreferences> {
    const userId = this.authService.getCurrentUserId();

    return this.http.get<UserPreferences>(`/api/v1/users/${userId}/preferences`).pipe(
      tap(prefs => {
        this.preferencesSubject.next(prefs);
        this.cacheLocally(prefs);
      }),
      catchError(() => of(this.loadFromLocalCache()))
    );
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...updates };

    // Optimistic update
    this.preferencesSubject.next(updated);
    this.cacheLocally(updated);

    // Queue for debounced save
    this.saveQueue$.next(updates);
  }

  private initializeAutoSave(): void {
    this.saveQueue$.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap(updates => this.saveToBackend(updates)),
      retry(3)
    ).subscribe();
  }

  private saveToBackend(updates: Partial<UserPreferences>): Observable<void> {
    const userId = this.authService.getCurrentUserId();
    return this.http.put<void>(`/api/v1/users/${userId}/preferences`, updates);
  }

  private cacheLocally(prefs: UserPreferences): void {
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  }

  private loadFromLocalCache(): UserPreferences {
    const cached = localStorage.getItem('userPreferences');
    return cached ? JSON.parse(cached) : DEFAULT_PREFERENCES;
  }
}
```

### Phase 4: Testing & Monitoring (Week 2)

**Unit Tests**:
```typescript
describe('UserPreferencesService', () => {
  it('should persist theme preference', async () => {
    await service.updatePreferences({ theme: 'dark' });
    const prefs = await service.getPreferences(userId);
    expect(prefs.theme).toBe('dark');
  });

  it('should handle partial updates', async () => {
    await service.updatePreferences({ theme: 'dark' });
    await service.updatePreferences({ language: 'es' });
    const prefs = await service.getPreferences(userId);
    expect(prefs.theme).toBe('dark');  // Preserved
    expect(prefs.language).toBe('es'); // Updated
  });
});
```

**Performance Tests**:
```typescript
describe('Performance', () => {
  it('should read preferences in <100ms', async () => {
    const start = Date.now();
    await service.getPreferences(userId);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

**Monitoring**:
```typescript
// Add Prometheus metrics
const prefsReadDuration = new Histogram({
  name: 'user_preferences_read_duration_ms',
  help: 'Duration of preference reads',
  buckets: [10, 25, 50, 100, 250, 500, 1000]
});

const prefsWriteDuration = new Histogram({
  name: 'user_preferences_write_duration_ms',
  help: 'Duration of preference writes',
  buckets: [50, 100, 250, 500, 1000, 2000]
});
```

---

## Success Metrics

### Performance Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Read latency (p50) | <50ms | Prometheus histogram |
| Read latency (p95) | <100ms | Prometheus histogram |
| Read latency (p99) | <250ms | Prometheus histogram |
| Write latency (p95) | <500ms | Prometheus histogram |
| Concurrent users | >10,000 | Load testing |

### Reliability Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Data loss | 0% | Audit logs |
| Preference corruption | 0% | Data validation |
| API availability | 99.9% | Uptime monitoring |

### User Experience Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Preferences sync time | <5s | Client-side timing |
| Offline functionality | 100% | localStorage fallback |
| Default preference satisfaction | >90% | User surveys |

### Business Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Infrastructure cost | $0 additional | AWS/GCP billing |
| Development time | <2 weeks | Sprint planning |
| Support tickets (preference issues) | <1% | Ticketing system |

---

## Review and Monitoring Plan

### Week 1 Post-Launch
- Monitor p95 read/write latency daily
- Check for any data corruption errors
- Validate backup/restore procedures

### Month 1 Post-Launch
- Analyze usage patterns (which preferences change most?)
- Review performance metrics vs targets
- User feedback survey on preference experience

### Quarterly Review
- Evaluate if Redis caching layer needed
- Review new preference requests
- Check database size growth

### Decision Review Triggers
**Re-evaluate this decision if**:
- p95 read latency consistently exceeds 100ms
- User complaints about slow preference loading
- Database preferences table exceeds 50% of total DB size
- Feature request for offline-first preferences

---

## Related Documentation

- [Angular Architecture - State Management](../angular-architecture.md#state-management)
- [Current State Analysis](../current-state-analysis.md)
- [Improvement Roadmap - Phase 2](../improvement-roadmap.md#phase-2-state-management-week-2)
- [User Stories - US-042: User Preferences Persistence](../../requirements/user-stories.md#us-042) *(to be created)*

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-24 | Initial ADR created | Autos2 Team |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | TBD | 2025-10-24 | Approved |
| Product Owner | TBD | 2025-10-24 | Approved |
| DevOps | TBD | 2025-10-24 | Approved |
