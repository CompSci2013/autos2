# Phase 6.5: Customizable Dashboard Layout

**Status**: 📋 Planned (Future Enhancement)
**Priority**: 🟢 LOW (Power user feature, substantial effort)
**Effort Estimate**: 15-20 hours
**Dependencies**: Requires PostgreSQL user preferences API, authentication
**Inspired By**: Workshop page from legacy Autos application

---

## Problem Statement

### Current Limitations
1. **Fixed Layout**: All users see same page layout
2. **No Personalization**: Cannot rearrange UI to match workflow
3. **One-Size-Fits-All**: Casual users and power users have different needs
4. **Missing in Legacy**: Users expect customizable dashboards

### User Impact
- **Power users** want to optimize for their workflow
- **Analysts** need charts prominently displayed
- **Casual users** prefer simple search-first layout

---

## Solution Overview

Implement **drag-and-drop, resizable dashboard panels** using angular-gridster2, with layouts persisted to PostgreSQL user preferences.

---

## High-Level Architecture

### 1. Technology Stack

- **angular-gridster2**: Drag-and-drop grid layout
- **PostgreSQL JSONB**: Store user layout preferences
- **User Preferences API**: Backend service for CRUD operations

### 2. Panel Types

Define reusable panel components:

1. **SearchFiltersPanel**: Filter controls
2. **ResultsTablePanel**: Vehicle search results
3. **ChartPanel**: Distribution charts (manufacturer, body class, year)
4. **StatsPanel**: Summary statistics
5. **MapPanel** (future): Geographic distribution
6. **TimelinePanel** (future): Year-based timeline

### 3. Layout Configuration Schema

```typescript
export interface DashboardLayout {
  userId: string;
  layoutName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  panels: DashboardPanel[];
}

export interface DashboardPanel {
  id: string;
  type: PanelType;
  x: number;
  y: number;
  cols: number;
  rows: number;
  minCols?: number;
  minRows?: number;
  config?: any; // Panel-specific configuration
}

export type PanelType =
  | 'search-filters'
  | 'results-table'
  | 'chart-manufacturer'
  | 'chart-bodyclass'
  | 'chart-year'
  | 'stats-summary';
```

---

## Implementation Phases

### Phase 1: Infrastructure (6 hours)

1. **Install angular-gridster2**:
   ```bash
   npm install --save angular-gridster2
   ```

2. **Create Dashboard Framework Component**:
   ```typescript
   @Component({
     selector: 'app-dashboard',
     template: `
       <gridster [options]="options">
         <gridster-item
           *ngFor="let panel of dashboard"
           [item]="panel">
           <app-panel-container
             [panelType]="panel.type"
             [config]="panel.config">
           </app-panel-container>
         </gridster-item>
       </gridster>
     `
   })
   export class DashboardComponent implements OnInit {
     options: GridsterConfig;
     dashboard: DashboardPanel[] = [];

     ngOnInit(): void {
       this.options = {
         gridType: GridType.Fit,
         displayGrid: DisplayGrid.OnDragAndResize,
         pushItems: true,
         draggable: { enabled: true },
         resizable: { enabled: true },
         itemChangeCallback: this.itemChange.bind(this)
       };

       this.loadLayout();
     }

     itemChange(item: GridsterItem): void {
       // Auto-save on drag/resize
       this.saveLayout();
     }

     loadLayout(): void {
       this.dashboardService.getUserLayout()
         .subscribe(layout => this.dashboard = layout.panels);
     }

     saveLayout(): void {
       this.dashboardService.saveUserLayout({
         panels: this.dashboard
       }).subscribe();
     }
   }
   ```

### Phase 2: Backend API (4 hours)

1. **PostgreSQL Schema**:
   ```sql
   CREATE TABLE user_dashboard_layouts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id),
     layout_name VARCHAR(100) NOT NULL,
     is_default BOOLEAN DEFAULT false,
     panels JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, layout_name)
   );

   CREATE INDEX idx_user_layouts ON user_dashboard_layouts(user_id);
   ```

2. **API Endpoints**:
   ```
   GET    /api/v1/users/:userId/layouts
   POST   /api/v1/users/:userId/layouts
   PUT    /api/v1/users/:userId/layouts/:layoutId
   DELETE /api/v1/users/:userId/layouts/:layoutId
   POST   /api/v1/users/:userId/layouts/:layoutId/set-default
   ```

### Phase 3: Panel Components (5 hours)

Create wrapper components for each panel type:

```typescript
@Component({
  selector: 'app-panel-container',
  template: `
    <div class="panel-wrapper">
      <div class="panel-header">
        <h4>{{ getPanelTitle() }}</h4>
        <button nz-button nzSize="small" (click)="removePanel()">
          <i nz-icon nzType="close"></i>
        </button>
      </div>
      <div class="panel-content">
        <app-search-filters *ngIf="panelType === 'search-filters'"></app-search-filters>
        <app-results-table *ngIf="panelType === 'results-table'"></app-results-table>
        <app-distribution-chart
          *ngIf="panelType === 'chart-manufacturer'"
          [data]="manufacturerData$ | async">
        </app-distribution-chart>
        <!-- Other panel types -->
      </div>
    </div>
  `
})
export class PanelContainerComponent {
  @Input() panelType: PanelType;
  @Input() config: any;
  @Output() remove = new EventEmitter<void>();

  getPanelTitle(): string {
    const titles: Record<PanelType, string> = {
      'search-filters': 'Search Filters',
      'results-table': 'Results',
      'chart-manufacturer': 'Manufacturers',
      'chart-bodyclass': 'Body Classes',
      'chart-year': 'Year Distribution',
      'stats-summary': 'Summary'
    };
    return titles[this.panelType];
  }

  removePanel(): void {
    this.remove.emit();
  }
}
```

---

## User Experience

### Layout Management UI

```html
<nz-page-header>
  <nz-page-header-title>My Dashboard</nz-page-header-title>
  <nz-page-header-extra>
    <nz-button-group>
      <button nz-button (click)="openLayoutManager()">
        <i nz-icon nzType="layout"></i> Manage Layouts
      </button>
      <button nz-button (click)="addPanel()">
        <i nz-icon nzType="plus"></i> Add Panel
      </button>
      <button nz-button (click)="resetToDefault()">
        <i nz-icon nzType="reload"></i> Reset to Default
      </button>
    </nz-button-group>
  </nz-page-header-extra>
</nz-page-header>
```

### Add Panel Modal

```typescript
openAddPanelModal(): void {
  const modal = this.modal.create({
    nzTitle: 'Add Panel',
    nzContent: AddPanelComponent,
    nzFooter: null
  });

  modal.afterClose.subscribe(panelType => {
    if (panelType) {
      this.addPanelToDashboard(panelType);
    }
  });
}
```

---

## Default Layouts

### Casual User Layout
- Large search filters (top)
- Medium results table (bottom)

### Power User Layout
- Small filters (left sidebar, 3 cols)
- Large results table (center, 6 cols)
- Charts column (right, 3 cols)

### Analyst Layout
- Minimal filters (collapsed, 2 cols)
- Multiple charts (4-6 panels, 2x2 grid)
- Stats panel (bottom)

---

## Success Criteria

- [ ] Users can drag panels to rearrange layout
- [ ] Users can resize panels
- [ ] Users can add/remove panels
- [ ] Layouts auto-save to database
- [ ] Users can create multiple named layouts
- [ ] Users can switch between layouts
- [ ] Reset to default layout works
- [ ] Default layouts provided for different user types
- [ ] Layout state persists across sessions
- [ ] Performance acceptable with 6+ panels

---

## Open Questions

1. **Authentication Required**: Need user accounts first
2. **Multi-Device Sync**: Should layouts sync across devices?
3. **Layout Sharing**: Allow users to share/export layouts?
4. **Admin Defaults**: Should admins define org-wide default layouts?

---

## References

- Workshop screenshots from legacy Autos application
- angular-gridster2: https://github.com/tiberiuzuld/angular-gridster2
- GridsterJS Demo: https://tiberiuzuld.github.io/angular-gridster2/
