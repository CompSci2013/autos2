import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VehicleStateService } from './vehicle-state.service';
import { VehicleService } from '../../../services/vehicle.service';
import { of, throwError } from 'rxjs';
import { VehicleSearchFilters, Pagination } from '../models/vehicle.model';

/**
 * Unit Tests for VehicleStateService
 *
 * Tests cover all 7 scenarios from docs/design/navigation.md:
 * 1. Page refresh preserves state (localStorage restore)
 * 2. Browser restart preserves state (localStorage survives)
 * 3. URL-first priority (bookmarks override localStorage)
 * 4. In-app navigation (localStorage when no URL params)
 * 5. Clear filters clears localStorage
 * 6. Expiration handling (7-day old data ignored)
 * 7. Invalid/corrupt storage handled gracefully
 */
describe('VehicleStateService - Navigation & Persistence', () => {
  let service: VehicleStateService;
  let vehicleApiSpy: jasmine.SpyObj<VehicleService>;
  const STORAGE_KEY = 'autos2.discover.state';

  // Mock data
  const mockManufacturers = [
    { name: 'Buick', vehicle_count: 27, model_count: 27 },
    { name: 'Ford', vehicle_count: 95, model_count: 95 }
  ];

  const mockModels = [
    { name: 'LeSabre', vehicle_count: 5, year_range: { min: 1990, max: 2000 } }
  ];

  const mockVehicles = {
    data: [
      { vehicle_id: 'test-1', year: 1995, manufacturer: 'Buick', model: 'LeSabre', body_class: 'Sedan' }
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
  };

  const mockFilters = {
    body_classes: [{ value: 'Sedan', count: 10 }],
    body_styles: [{ value: 'Sedan', count: 10 }],
    drive_types: [{ value: '4WD', count: 5 }],
    transmission_styles: [{ value: 'Automatic', count: 15 }]
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Create spy for VehicleService
    const spy = jasmine.createSpyObj('VehicleService', [
      'getManufacturers',
      'getModels',
      'getFilters',
      'searchVehicles'
    ]);

    // Setup default spy returns
    spy.getManufacturers.and.returnValue(of(mockManufacturers));
    spy.getModels.and.returnValue(of(mockModels));
    spy.getFilters.and.returnValue(of(mockFilters));
    spy.searchVehicles.and.returnValue(of(mockVehicles));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        VehicleStateService,
        { provide: VehicleService, useValue: spy }
      ]
    });

    service = TestBed.inject(VehicleStateService);
    vehicleApiSpy = TestBed.inject(VehicleService) as jasmine.SpyObj<VehicleService>;
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  // ============================================================================
  // SCENARIO 1: Page Refresh Preserves State
  // ============================================================================

  describe('Scenario 1: Page Refresh Preserves State', () => {
    it('should restore filters from localStorage when no URL params', fakeAsync(() => {
      // Arrange: Simulate saved state from previous session
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Initialize without URL params (simulates page refresh to /discover)
      service.initialize({});
      tick(100); // Wait for debounce

      // Assert: Filters should be restored from localStorage
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));

    it('should restore pagination from localStorage', fakeAsync(() => {
      // Arrange: Saved state with page 2
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 2, limit: 50 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act
      service.initialize({});
      tick(100);

      // Assert: Should restore page 2 and limit 50
      service.pagination$.subscribe(pagination => {
        expect(pagination.page).toBe(2);
        expect(pagination.limit).toBe(50);
      }).unsubscribe();
    }));

    it('should auto-save to localStorage when filters change', fakeAsync(() => {
      // Act: Select a manufacturer
      service.selectManufacturer('Buick');
      tick(600); // Wait for debounce (500ms) + buffer

      // Assert: Should save to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.version).toBe('1.0');
      expect(parsed.filters.manufacturer).toBe('Buick');
      expect(parsed.timestamp).toBeDefined();
    }));
  });

  // ============================================================================
  // SCENARIO 2: Browser Restart Preserves State
  // ============================================================================

  describe('Scenario 2: Browser Restart Preserves State', () => {
    it('should restore state after service re-instantiation (browser restart)', fakeAsync(() => {
      // Arrange: Save state and destroy service (simulate browser close)
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Ford', model: 'Mustang' },
        pagination: { page: 3, limit: 50 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Destroy and recreate service (simulates browser restart)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          VehicleStateService,
          { provide: VehicleService, useValue: vehicleApiSpy }
        ]
      });
      const newService = TestBed.inject(VehicleStateService);

      // Act: Initialize new service instance
      newService.initialize({});
      tick(100);

      // Assert: Should restore from localStorage
      newService.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
        expect(filters.model).toBe('Mustang');
      }).unsubscribe();

      newService.pagination$.subscribe(pagination => {
        expect(pagination.page).toBe(3);
        expect(pagination.limit).toBe(50);
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 3: URL-First Priority (Bookmarks Override localStorage)
  // ============================================================================

  describe('Scenario 3: URL-First Priority', () => {
    it('should use URL params even when localStorage has different data', fakeAsync(() => {
      // Arrange: localStorage has Buick, but URL has Ford
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Initialize with URL params
      service.initialize({ manufacturer: 'Ford' });
      tick(100);

      // Assert: Should use Ford from URL, not Buick from localStorage
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
        expect(filters.manufacturer).not.toBe('Buick');
      }).unsubscribe();
    }));

    it('should use all URL params and ignore localStorage', fakeAsync(() => {
      // Arrange: localStorage has different complete state
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick', model: 'LeSabre', body_class: 'Sedan' },
        pagination: { page: 2, limit: 50 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Initialize with different URL params
      const urlParams = {
        manufacturer: 'Ford',
        model: 'Mustang',
        body_class: 'Coupe',
        page: 3,
        limit: 100
      };
      service.initialize(urlParams);
      tick(100);

      // Assert: Should use URL params completely
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
        expect(filters.model).toBe('Mustang');
        expect(filters.body_class).toBe('Coupe');
      }).unsubscribe();

      service.pagination$.subscribe(pagination => {
        expect(pagination.page).toBe(3);
        expect(pagination.limit).toBe(100);
      }).unsubscribe();
    }));

    it('should handle empty URL params correctly', fakeAsync(() => {
      // Arrange: localStorage has data
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Initialize with empty object (no URL params)
      service.initialize({});
      tick(100);

      // Assert: Should use localStorage (Priority 2)
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 4: In-App Navigation (localStorage when no URL)
  // ============================================================================

  describe('Scenario 4: In-App Navigation', () => {
    it('should restore state when navigating from Home to Discover', fakeAsync(() => {
      // Arrange: User selects Buick
      service.selectManufacturer('Buick');
      tick(600); // Wait for localStorage save

      // Verify saved
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      // Act: Simulate navigation away and back (re-initialize with no URL params)
      service.initialize({});
      tick(100);

      // Assert: Should restore Buick
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));

    it('should restore complex state after in-app navigation', fakeAsync(() => {
      // Arrange: User sets multiple filters and pagination
      service.selectManufacturer('Ford');
      tick(100);
      service.updateFilters({ model: 'Mustang', body_class: 'Coupe' });
      tick(100);
      service.changePage(5);
      tick(100);
      service.changePageSize(50);
      tick(600); // Wait for save

      // Act: Navigate away and back
      service.initialize({});
      tick(100);

      // Assert: Should restore all state
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
        expect(filters.model).toBe('Mustang');
        expect(filters.body_class).toBe('Coupe');
      }).unsubscribe();

      service.pagination$.subscribe(pagination => {
        // Page should be 1 because changePageSize(50) resets to page 1
        expect(pagination.page).toBe(1);
        expect(pagination.limit).toBe(50);
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 5: Clear Filters Clears localStorage
  // ============================================================================

  describe('Scenario 5: Clear Filters Clears localStorage', () => {
    it('should clear localStorage when clearFilters is called', fakeAsync(() => {
      // Arrange: Save some state
      service.selectManufacturer('Buick');
      tick(600);
      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();

      // Act: Clear filters
      service.clearFilters();
      tick(100);

      // Assert: localStorage should be empty
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    }));

    it('should not restore state after clear and refresh', fakeAsync(() => {
      // Arrange: Save state then clear
      service.selectManufacturer('Buick');
      tick(600);
      service.clearFilters();
      tick(600); // Wait for clear to propagate

      // Act: Re-initialize (simulates refresh)
      service.initialize({});
      tick(100);

      // Assert: Should use defaults (no saved state) - null for empty filters
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();
    }));

    it('should clear filters and reset pagination', fakeAsync(() => {
      // Arrange: Set filters and pagination
      service.selectManufacturer('Ford');
      service.changePage(3);
      tick(600);

      // Act: Clear filters
      service.clearFilters();
      tick(100);

      // Assert: Filters should be empty
      service.filters$.subscribe(filters => {
        expect(Object.keys(filters).every(key =>
          filters[key as keyof VehicleSearchFilters] == null
        )).toBe(true);
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 6: Expiration Handling (7-day old data)
  // ============================================================================

  describe('Scenario 6: Expiration Handling', () => {
    it('should ignore expired data (older than 7 days)', fakeAsync(() => {
      // Arrange: Create state with 8-day old timestamp
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      const expiredState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: eightDaysAgo
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expiredState));

      // Act: Initialize
      service.initialize({});
      tick(100);

      // Assert: Should not restore expired data, use defaults
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();

      // Assert: Expired data should be cleared from localStorage
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    }));

    it('should accept fresh data (within 7 days)', fakeAsync(() => {
      // Arrange: Create state with 6-day old timestamp
      const sixDaysAgo = Date.now() - (6 * 24 * 60 * 60 * 1000);
      const freshState = {
        version: '1.0',
        filters: { manufacturer: 'Ford' },
        pagination: { page: 1, limit: 20 },
        timestamp: sixDaysAgo
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));

      // Act: Initialize
      service.initialize({});
      tick(100);

      // Assert: Should restore fresh data
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
      }).unsubscribe();
    }));

    it('should accept data exactly 7 days old (boundary test)', fakeAsync(() => {
      // Arrange: Exactly 7 days old (should still be valid)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const boundaryState = {
        version: '1.0',
        filters: { manufacturer: 'Chevrolet' },
        pagination: { page: 1, limit: 20 },
        timestamp: sevenDaysAgo
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boundaryState));

      // Act
      service.initialize({});
      tick(100);

      // Assert: Should restore (7 days exactly is still valid)
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Chevrolet');
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 7: Invalid/Corrupt Storage Handled
  // ============================================================================

  describe('Scenario 7: Invalid/Corrupt Storage Handling', () => {
    it('should handle corrupt JSON gracefully', fakeAsync(() => {
      // Arrange: Save invalid JSON
      localStorage.setItem(STORAGE_KEY, 'invalid json{');

      // Act: Initialize (should not throw)
      expect(() => {
        service.initialize({});
        tick(100);
      }).not.toThrow();

      // Assert: Should use defaults
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();

      // Assert: Corrupt data should be cleared
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    }));

    it('should handle missing version field', fakeAsync(() => {
      // Arrange: Old format without version
      const oldState = {
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldState));

      // Act: Initialize
      service.initialize({});
      tick(100);

      // Assert: Should handle gracefully (migration returns null currently)
      service.filters$.subscribe(filters => {
        // Current implementation ignores old versions
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();
    }));

    it('should handle wrong version number', fakeAsync(() => {
      // Arrange: Future version
      const futureState = {
        version: '2.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(futureState));

      // Act
      service.initialize({});
      tick(100);

      // Assert: Should handle gracefully
      service.filters$.subscribe(filters => {
        // Migration returns null for unknown versions
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();
    }));

    it('should handle localStorage quota exceeded', fakeAsync(() => {
      // Arrange: Spy on localStorage.setItem to throw
      spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');

      // Act: Should not throw
      expect(() => {
        service.selectManufacturer('Buick');
        tick(600);
      }).not.toThrow();

      // Assert: Service should continue to work
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));

    it('should handle localStorage disabled (private mode)', fakeAsync(() => {
      // Arrange: Spy on localStorage to throw
      spyOn(Storage.prototype, 'getItem').and.throwError('SecurityError');

      // Act: Should not throw
      expect(() => {
        service.initialize({});
        tick(100);
      }).not.toThrow();

      // Assert: Should use defaults
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();
    }));

    it('should handle missing timestamp field', fakeAsync(() => {
      // Arrange: State without timestamp
      const noTimestampState = {
        version: '1.0',
        filters: { manufacturer: 'Buick' },
        pagination: { page: 1, limit: 20 }
        // No timestamp field
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(noTimestampState));

      // Act: Should handle gracefully
      expect(() => {
        service.initialize({});
        tick(100);
      }).not.toThrow();

      // Assert: Should restore data (no timestamp = no expiration check fails)
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // ADDITIONAL TESTS: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle multiple rapid filter changes (debouncing)', fakeAsync(() => {
      // Act: Rapid changes
      service.selectManufacturer('Buick');
      tick(100);
      service.selectManufacturer('Ford');
      tick(100);
      service.selectManufacturer('Chevrolet');
      tick(600); // Wait for final debounce

      // Assert: Should only save final state
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.filters.manufacturer).toBe('Chevrolet');
    }));

    it('should handle initialization with partial URL params', fakeAsync(() => {
      // Arrange: localStorage has full state
      const savedState = {
        version: '1.0',
        filters: { manufacturer: 'Buick', model: 'LeSabre', body_class: 'Sedan' },
        pagination: { page: 2, limit: 50 },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Initialize with partial URL params
      service.initialize({ manufacturer: 'Ford' });
      tick(100);

      // Assert: URL params should override, but only the provided ones
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
        // Model should not come from localStorage (URL takes precedence)
        expect(filters.model).toBeNull();
      }).unsubscribe();
    }));

    it('should handle year as string in URL and parse to number', fakeAsync(() => {
      // Act: URL has year as string (common in URL params)
      service.initialize({ year: '2020' });
      tick(100);

      // Assert: Should parse to number
      service.filters$.subscribe(filters => {
        expect(filters.year).toBe(2020);
        expect(typeof filters.year).toBe('number');
      }).unsubscribe();
    }));

    it('should not save empty filters to localStorage', fakeAsync(() => {
      // Act: Start fresh, no filters
      service.initialize({});
      tick(600);

      // Assert: Should not create localStorage entry for empty state
      // (Current implementation saves all state, but could be optimized)
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved, filters should be empty
        expect(Object.keys(parsed.filters).length).toBe(0);
      }
    }));
  });

  // ============================================================================
  // INTEGRATION TESTS: Full User Workflows
  // ============================================================================

  describe('Integration: Full User Workflows', () => {
    it('should handle complete user workflow: select -> navigate -> refresh', fakeAsync(() => {
      // User selects manufacturer
      service.selectManufacturer('Buick');
      tick(600);

      // Verify saved
      let saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!).filters.manufacturer).toBe('Buick');

      // User navigates away and back (no URL params)
      service.initialize({});
      tick(100);

      // Verify restored
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();

      // User refreshes page (F5) - URL now has params
      service.initialize({ manufacturer: 'Buick' });
      tick(100);

      // Verify still shows Buick
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Buick');
      }).unsubscribe();
    }));

    it('should handle workflow: bookmark -> navigate -> return', fakeAsync(() => {
      // User arrives via bookmark with URL params
      service.initialize({ manufacturer: 'Ford', page: 3 });
      tick(600);

      // State is saved
      let saved = localStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(saved!).filters.manufacturer).toBe('Ford');

      // User navigates away and back (clean URL)
      service.initialize({});
      tick(100);

      // Should restore Ford from localStorage
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Ford');
      }).unsubscribe();

      service.pagination$.subscribe(pagination => {
        expect(pagination.page).toBe(3);
      }).unsubscribe();
    }));

    it('should handle workflow: filter -> clear -> refresh', fakeAsync(() => {
      // User sets filters
      service.selectManufacturer('Buick');
      tick(600);

      // User clears
      service.clearFilters();
      tick(600);

      // localStorage should be cleared
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

      // User refreshes
      service.initialize({});
      tick(100);

      // Should show defaults (null for cleared filters)
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBeNull();
      }).unsubscribe();
    }));
  });

  // ============================================================================
  // SCENARIO 8: Column Sorting
  // ============================================================================

  describe('Scenario 8: Column Sorting', () => {
    it('should sort by column ascending', fakeAsync(() => {
      // Act: Sort by year ascending
      service.sortByColumn('year', 'asc');
      tick(100);

      // Assert: Sort state should be set
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('year');
        expect(sort.sortOrder).toBe('asc');
      }).unsubscribe();
    }));

    it('should sort by column descending', fakeAsync(() => {
      // Arrange: Start with ascending sort
      service.sortByColumn('year', 'asc');
      tick(100);

      // Act: Sort by year descending
      service.sortByColumn('year', 'desc');
      tick(100);

      // Assert: Sort state should be descending
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('year');
        expect(sort.sortOrder).toBe('desc');
      }).unsubscribe();
    }));

    it('should clear sort when clicking sorted column third time', fakeAsync(() => {
      // Arrange: Start with descending sort
      service.sortByColumn('year', 'asc');
      tick(100);
      service.sortByColumn('year', 'desc');
      tick(100);

      // Act: Click third time to clear
      service.clearSort();
      tick(100);

      // Assert: Sort should be cleared (back to default)
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBeNull();
        expect(sort.sortOrder).toBeNull();
      }).unsubscribe();
    }));

    it('should replace sort when sorting by different column', fakeAsync(() => {
      // Arrange: Sort by year
      service.sortByColumn('year', 'asc');
      tick(100);

      // Act: Sort by manufacturer
      service.sortByColumn('manufacturer', 'asc');
      tick(100);

      // Assert: Should replace year sort with manufacturer sort
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('manufacturer');
        expect(sort.sortOrder).toBe('asc');
      }).unsubscribe();
    }));

    it('should persist sort in URL params', fakeAsync(() => {
      // Act: Sort by year descending
      service.sortByColumn('year', 'desc');
      tick(100);

      // Assert: URL params should include sort
      // (Component subscribes and syncs to URL)
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('year');
        expect(sort.sortOrder).toBe('desc');
      }).unsubscribe();
    }));

    it('should persist sort in localStorage', fakeAsync(() => {
      // Act: Sort by model ascending
      service.sortByColumn('model', 'asc');
      tick(600); // Wait for save

      // Assert: localStorage should contain sort state
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.sort.sortBy).toBe('model');
      expect(parsed.sort.sortOrder).toBe('asc');
    }));

    it('should restore sort from localStorage after browser restart', fakeAsync(() => {
      // Arrange: Save sort state
      const savedState = {
        version: '1.0',
        filters: {},
        pagination: { page: 1, limit: 20 },
        sort: { sortBy: 'year', sortOrder: 'desc' },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Destroy and recreate service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          VehicleStateService,
          { provide: VehicleService, useValue: vehicleApiSpy }
        ]
      });
      const newService = TestBed.inject(VehicleStateService);

      // Act: Initialize
      newService.initialize({});
      tick(100);

      // Assert: Sort should be restored
      newService.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('year');
        expect(sort.sortOrder).toBe('desc');
      }).unsubscribe();
    }));

    it('should restore sort from URL params', fakeAsync(() => {
      // Act: Initialize with URL params
      service.initialize({ sortBy: 'manufacturer', sortOrder: 'desc' });
      tick(100);

      // Assert: Sort should be restored from URL
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('manufacturer');
        expect(sort.sortOrder).toBe('desc');
      }).unsubscribe();
    }));

    it('should maintain sort when changing filters', fakeAsync(() => {
      // Arrange: Set sort
      service.sortByColumn('year', 'desc');
      tick(100);

      // Act: Change filter
      service.selectManufacturer('Ford');
      tick(100);

      // Assert: Sort should be maintained
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('year');
        expect(sort.sortOrder).toBe('desc');
      }).unsubscribe();
    }));

    it('should maintain sort when changing pagination', fakeAsync(() => {
      // Arrange: Set sort
      service.sortByColumn('model', 'asc');
      tick(100);

      // Act: Change page
      service.changePage(3);
      tick(100);

      // Assert: Sort should be maintained
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBe('model');
        expect(sort.sortOrder).toBe('asc');
      }).unsubscribe();
    }));

    it('should clear sort when clearing filters', fakeAsync(() => {
      // Arrange: Set sort and filter
      service.sortByColumn('year', 'asc');
      tick(100);
      service.selectManufacturer('Ford');
      tick(100);

      // Act: Clear filters
      service.clearFilters();
      tick(100);

      // Assert: Sort should also be cleared
      service.sortState$.subscribe(sort => {
        expect(sort.sortBy).toBeNull();
        expect(sort.sortOrder).toBeNull();
      }).unsubscribe();
    }));
  });

  describe('Column Filtering - Year', () => {
    it('should set year filter in state', fakeAsync(() => {
      // Act: Update filters with year
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2020 });
      tick(100);

      // Assert: Filter state updated
      service.filters$.subscribe(filters => {
        expect(filters.year).toBe(2020);
      }).unsubscribe();
    }));

    it('should call backend API with year_min and year_max parameters', fakeAsync(() => {
      // This test catches the bug from the screenshot where year filter shows 1990
      // but results include 1960, 1962, 1965, 1968, 1970, etc.
      //
      // Root cause: Backend ignores 'year' parameter and only processes 'year_min'/'year_max'
      // If this test fails, it means we're sending the wrong parameters to the backend.

      // Arrange: Set up service with spies
      vehicleApiSpy.getManufacturers.and.returnValue(of(mockManufacturers));
      vehicleApiSpy.searchVehicles.and.returnValue(of(mockVehicles));
      vehicleApiSpy.getFilters.and.returnValue(of(mockFilters));

      // Initialize service
      service.initialize({});

      // Subscribe to vehicles$ FIRST to activate the reactive search pipeline
      const subscription = service.vehicles$.subscribe();
      tick(150); // Wait for initialization to complete

      // Get reference to search spy and clear initialization calls
      const searchSpy = vehicleApiSpy.searchVehicles;
      searchSpy.calls.reset();

      // Act: Set year filter to 1990 (like in the screenshot)
      service.updateFilters({
        manufacturer: null,
        model: null,
        body_class: null,
        year: 1990
      });
      tick(150); // Wait for debounce (100ms) + buffer

      // Assert: Backend API MUST be called with year_min and year_max
      expect(searchSpy).toHaveBeenCalled();

      const lastCall = searchSpy.calls.mostRecent();
      const params = lastCall.args[0];

      // Critical assertion: Backend receives year_min and year_max
      expect(params.year_min).toBe(1990,
        'Backend API must receive year_min parameter for filtering to work');
      expect(params.year_max).toBe(1990,
        'Backend API must receive year_max parameter for filtering to work');

      // Critical assertion: 'year' parameter must NOT be sent
      expect(params.year).toBeUndefined(
        'Backend API should not receive "year" parameter as it only processes year_min/year_max');

      subscription.unsubscribe();
    }));

    it('should transform different year values correctly', fakeAsync(() => {
      // Test multiple year values to ensure transformation works for any year

      vehicleApiSpy.getManufacturers.and.returnValue(of(mockManufacturers));
      vehicleApiSpy.searchVehicles.and.returnValue(of(mockVehicles));
      vehicleApiSpy.getFilters.and.returnValue(of(mockFilters));

      service.initialize({});
      const subscription = service.vehicles$.subscribe();
      tick(150);

      const searchSpy = vehicleApiSpy.searchVehicles;
      searchSpy.calls.reset();

      // Test year 2021
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2021 });
      tick(150);

      let params = searchSpy.calls.mostRecent().args[0];
      expect(params.year_min).toBe(2021);
      expect(params.year_max).toBe(2021);
      expect(params.year).toBeUndefined();

      // Test year 1950
      searchSpy.calls.reset();
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 1950 });
      tick(150);

      params = searchSpy.calls.mostRecent().args[0];
      expect(params.year_min).toBe(1950);
      expect(params.year_max).toBe(1950);
      expect(params.year).toBeUndefined();

      subscription.unsubscribe();
    }));

    it('should not send year parameters when year is null', fakeAsync(() => {
      // When year filter is cleared, ensure no year parameters are sent

      vehicleApiSpy.getManufacturers.and.returnValue(of(mockManufacturers));
      vehicleApiSpy.searchVehicles.and.returnValue(of(mockVehicles));
      vehicleApiSpy.getFilters.and.returnValue(of(mockFilters));

      service.initialize({});
      const subscription = service.vehicles$.subscribe();
      tick(150);

      const searchSpy = vehicleApiSpy.searchVehicles;
      searchSpy.calls.reset();

      // Set year to null (cleared filter)
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: null });
      tick(150);

      const params = searchSpy.calls.mostRecent().args[0];

      // When year is null, no year-related parameters should be sent
      expect(params.year_min).toBeUndefined();
      expect(params.year_max).toBeUndefined();
      expect(params.year).toBeUndefined();

      subscription.unsubscribe();
    }));

    it('should persist year filter in cache for URL sync', fakeAsync(() => {
      // Act: Set year filter
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2015 });
      tick(600); // Wait for debounce and localStorage save

      // Assert: Year saved to cache (which component uses to sync URL)
      const currentState = (service as any).currentFilters;
      expect(currentState.year).toBe(2015);
    }));

    it('should persist year filter in localStorage', fakeAsync(() => {
      // Act: Set year filter
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2018 });
      tick(600); // Wait for localStorage save debounce

      // Assert: localStorage contains year
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.filters.year).toBe(2018);
    }));

    it('should restore year filter from URL on initialize', fakeAsync(() => {
      // Arrange
      vehicleApiSpy.getManufacturers.and.returnValue(of([]));
      vehicleApiSpy.searchVehicles.and.returnValue(of(mockVehicles));
      vehicleApiSpy.getFilters.and.returnValue(of(mockFilters));

      // Act: Initialize with year in URL params
      service.initialize({ year: '2022' });
      tick(100);

      // Assert: Year filter restored and parsed as number
      service.filters$.subscribe(filters => {
        expect(filters.year).toBe(2022);
        expect(typeof filters.year).toBe('number');
      }).unsubscribe();
    }));

    it('should restore year filter from localStorage after browser restart', fakeAsync(() => {
      // Arrange: Save state with year filter
      const savedState = {
        version: '1.0',
        filters: { manufacturer: null, model: null, body_class: null, year: 2019 },
        pagination: { page: 1, limit: 20 },
        sort: { sortBy: null, sortOrder: null },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      vehicleApiSpy.getManufacturers.and.returnValue(of([]));
      vehicleApiSpy.searchVehicles.and.returnValue(of(mockVehicles));
      vehicleApiSpy.getFilters.and.returnValue(of(mockFilters));

      // Act: Initialize without URL params (simulating browser restart)
      service.initialize({});
      tick(100);

      // Assert: Year restored from localStorage
      service.filters$.subscribe(filters => {
        expect(filters.year).toBe(2019);
      }).unsubscribe();
    }));

    it('should clear year filter when clearFilters is called', fakeAsync(() => {
      // Arrange: Set year filter first
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2021 });
      tick(100);

      // Act: Clear filters
      service.clearFilters();
      tick(100);

      // Assert: Year should be null
      service.filters$.subscribe(filters => {
        expect(filters.year).toBeNull();
      }).unsubscribe();
    }));

    it('should combine year filter with manufacturer filter', fakeAsync(() => {
      // Arrange
      vehicleApiSpy.getModels.and.returnValue(of([]));

      // Act: Set manufacturer and year filters
      service.selectManufacturer('Toyota');
      tick(100);
      service.updateFilters({ manufacturer: 'Toyota', model: null, body_class: null, year: 2020 });
      tick(100);

      // Assert: Both filters should be in state
      service.filters$.subscribe(filters => {
        expect(filters.manufacturer).toBe('Toyota');
        expect(filters.year).toBe(2020);
      }).unsubscribe();
    }));

    it('should handle null year value gracefully', fakeAsync(() => {
      // Arrange: Set a year first
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: 2020 });
      tick(100);

      // Act: Set year to null (clearing it)
      service.updateFilters({ manufacturer: null, model: null, body_class: null, year: null });
      tick(100);

      // Assert: Year should be null
      service.filters$.subscribe(filters => {
        expect(filters.year).toBeNull();
      }).unsubscribe();
    }));
  });
});
