# Gridster2 Cross-Grid Implementation Guide

## Overview

This document provides a complete implementation guide for dual-grid workspace with cross-grid drag-and-drop using gridster2.

---

## Installation

```bash
npm install angular-gridster2 --save
```

---

## Complete Implementation

### 1. Workspace Component

```typescript
// workspace.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GridsterConfig, GridsterItem, GridType, CompactType } from 'angular-gridster2';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GridTransferService } from './services/grid-transfer.service';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  leftGridOptions: GridsterConfig;
  rightGridOptions: GridsterConfig;

  leftGridItems: GridsterItem[] = [];
  rightGridItems: GridsterItem[] = [];

  constructor(private gridTransfer: GridTransferService) { }

  ngOnInit(): void {
    this.initializeGrids();
    this.loadGridState();
    this.subscribeToGridChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeGrids(): void {
    const baseConfig: GridsterConfig = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      margin: 10,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      useTransformPositioning: true,
      mobileBreakpoint: 640,
      minCols: 1,
      maxCols: 100,
      minRows: 1,
      maxRows: 100,
      maxItemCols: 100,
      minItemCols: 1,
      maxItemRows: 100,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      fixedColWidth: 105,
      fixedRowHeight: 105,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: true,
      enableEmptyCellDrag: false,
      enableOccupiedCellDrop: false,
      emptyCellDragMaxCols: 50,
      emptyCellDragMaxRows: 50,
      ignoreMarginInRow: false,
      draggable: {
        enabled: true,
        ignoreContentClass: 'no-drag',
        ignoreContent: false,
        dragHandleClass: 'drag-handle',
        stop: undefined,
        start: undefined
      },
      resizable: {
        enabled: true
      },
      swap: false,
      pushItems: true,
      disablePushOnDrag: false,
      disablePushOnResize: false,
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      displayGrid: 'onDrag&Resize',
      disableWindowResize: false,
      disableWarnings: false,
      scrollToNewItems: false,
      itemChangeCallback: undefined,
      itemResizeCallback: undefined
    };

    // Left grid configuration
    this.leftGridOptions = {
      ...baseConfig,
      emptyCellDropCallback: this.onLeftGridDrop.bind(this),
      draggable: {
        ...baseConfig.draggable,
        stop: this.onDragStop.bind(this, 'left')
      },
      itemChangeCallback: this.onLeftGridChange.bind(this)
    };

    // Right grid configuration
    this.rightGridOptions = {
      ...baseConfig,
      emptyCellDropCallback: this.onRightGridDrop.bind(this),
      draggable: {
        ...baseConfig.draggable,
        stop: this.onDragStop.bind(this, 'right')
      },
      itemChangeCallback: this.onRightGridChange.bind(this)
    };
  }

  private loadGridState(): void {
    // Load from localStorage or service
    const savedState = localStorage.getItem('workspaceState');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.leftGridItems = state.leftGrid || [];
      this.rightGridItems = state.rightGrid || [];
    } else {
      // Initialize with demo panels
      this.leftGridItems = [
        { cols: 2, rows: 1, y: 0, x: 0, id: 'left-1', panelType: 'stats' },
        { cols: 2, rows: 2, y: 1, x: 0, id: 'left-2', panelType: 'table' }
      ];

      this.rightGridItems = [
        { cols: 2, rows: 1, y: 0, x: 0, id: 'right-1', panelType: 'chart' },
        { cols: 2, rows: 2, y: 1, x: 0, id: 'right-2', panelType: 'table' }
      ];
    }

    this.gridTransfer.setGrids(this.leftGridItems, this.rightGridItems);
  }

  private subscribeToGridChanges(): void {
    this.gridTransfer.leftGrid$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.leftGridItems = items;
      this.saveGridState();
    });

    this.gridTransfer.rightGrid$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.rightGridItems = items;
      this.saveGridState();
    });
  }

  private saveGridState(): void {
    const state = {
      leftGrid: this.leftGridItems,
      rightGrid: this.rightGridItems
    };
    localStorage.setItem('workspaceState', JSON.stringify(state));
  }

  // Drag & Drop Handlers
  onDragStop(sourceGrid: 'left' | 'right', item: GridsterItem, gridsterItem: any, event: MouseEvent): void {
    const targetGrid = this.detectTargetGrid(event);

    if (targetGrid && targetGrid !== sourceGrid) {
      // Cross-grid drop detected
      this.gridTransfer.transferItem(item, sourceGrid, targetGrid);
    }
  }

  private detectTargetGrid(event: MouseEvent): 'left' | 'right' | null {
    const leftGridEl = document.querySelector('.left-grid');
    const rightGridEl = document.querySelector('.right-grid');

    if (!leftGridEl || !rightGridEl) return null;

    const leftRect = leftGridEl.getBoundingClientRect();
    const rightRect = rightGridEl.getBoundingClientRect();

    const x = event.clientX;
    const y = event.clientY;

    // Check if coordinates are within left grid
    if (x >= leftRect.left && x <= leftRect.right &&
        y >= leftRect.top && y <= leftRect.bottom) {
      return 'left';
    }

    // Check if coordinates are within right grid
    if (x >= rightRect.left && x <= rightRect.right &&
        y >= rightRect.top && y <= rightRect.bottom) {
      return 'right';
    }

    return null;
  }

  onLeftGridDrop(event: MouseEvent, item: GridsterItem): void {
    console.log('Item dropped on left grid:', item);
  }

  onRightGridDrop(event: MouseEvent, item: GridsterItem): void {
    console.log('Item dropped on right grid:', item);
  }

  onLeftGridChange(item: GridsterItem, gridsterItem: any): void {
    this.saveGridState();
  }

  onRightGridChange(item: GridsterItem, gridsterItem: any): void {
    this.saveGridState();
  }

  // Panel Actions
  removePanel(item: GridsterItem, grid: 'left' | 'right'): void {
    if (grid === 'left') {
      const index = this.leftGridItems.indexOf(item);
      this.leftGridItems.splice(index, 1);
    } else {
      const index = this.rightGridItems.indexOf(item);
      this.rightGridItems.splice(index, 1);
    }
    this.saveGridState();
  }

  addPanel(grid: 'left' | 'right', panelType: string): void {
    const newItem: GridsterItem = {
      cols: 2,
      rows: 2,
      y: 0,
      x: 0,
      id: `${grid}-${Date.now()}`,
      panelType
    };

    if (grid === 'left') {
      this.leftGridItems.push(newItem);
    } else {
      this.rightGridItems.push(newItem);
    }

    this.saveGridState();
  }
}
```

---

### 2. Template

```html
<!-- workspace.component.html -->
<div class="workspace-container">
  <div class="workspace-header">
    <h2>Dual Workspace</h2>
    <div class="actions">
      <button nz-button (click)="addPanel('left', 'table')">
        Add to Left
      </button>
      <button nz-button (click)="addPanel('right', 'chart')">
        Add to Right
      </button>
    </div>
  </div>

  <div class="grids-container">
    <!-- Left Grid -->
    <div class="grid-wrapper left-grid">
      <div class="grid-header">
        <h3>Left Workspace</h3>
      </div>
      <gridster [options]="leftGridOptions">
        <gridster-item *ngFor="let item of leftGridItems" [item]="item">
          <div class="panel-container">
            <div class="panel-header drag-handle">
              <span class="panel-title">{{ item.panelType | titlecase }}</span>
              <button nz-button nzType="text" nzSize="small"
                      (click)="removePanel(item, 'left')">
                <i nz-icon nzType="close"></i>
              </button>
            </div>
            <div class="panel-content">
              <!-- Dynamic panel content based on panelType -->
              <app-panel-content [type]="item.panelType" [data]="item.data">
              </app-panel-content>
            </div>
          </div>
        </gridster-item>
      </gridster>
    </div>

    <!-- Right Grid -->
    <div class="grid-wrapper right-grid">
      <div class="grid-header">
        <h3>Right Workspace</h3>
      </div>
      <gridster [options]="rightGridOptions">
        <gridster-item *ngFor="let item of rightGridItems" [item]="item">
          <div class="panel-container">
            <div class="panel-header drag-handle">
              <span class="panel-title">{{ item.panelType | titlecase }}</span>
              <button nz-button nzType="text" nzSize="small"
                      (click)="removePanel(item, 'right')">
                <i nz-icon nzType="close"></i>
              </button>
            </div>
            <div class="panel-content">
              <!-- Dynamic panel content based on panelType -->
              <app-panel-content [type]="item.panelType" [data]="item.data">
              </app-panel-content>
            </div>
          </div>
        </gridster-item>
      </gridster>
    </div>
  </div>
</div>
```

---

### 3. Styles

```scss
// workspace.component.scss
.workspace-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;

  .actions {
    display: flex;
    gap: 8px;
  }
}

.grids-container {
  display: flex;
  flex: 1;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &.left-grid {
    border: 2px dashed #1890ff;
  }

  &.right-grid {
    border: 2px dashed #52c41a;
  }
}

.grid-header {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

gridster {
  flex: 1;
  background: #fafafa;
}

.panel-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  cursor: move;

  &.drag-handle {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  .panel-title {
    font-weight: 600;
    font-size: 14px;
  }
}

.panel-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

// Gridster drag preview
::ng-deep {
  gridster-item {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .gridster-item-moving {
    opacity: 0.6;
    z-index: 1000;
  }
}
```

---

### 4. Grid Transfer Service

```typescript
// services/grid-transfer.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GridsterItem } from 'angular-gridster2';

@Injectable({
  providedIn: 'root'
})
export class GridTransferService {
  private leftGridSubject = new BehaviorSubject<GridsterItem[]>([]);
  private rightGridSubject = new BehaviorSubject<GridsterItem[]>([]);

  leftGrid$: Observable<GridsterItem[]> = this.leftGridSubject.asObservable();
  rightGrid$: Observable<GridsterItem[]> = this.rightGridSubject.asObservable();

  constructor() { }

  setGrids(leftItems: GridsterItem[], rightItems: GridsterItem[]): void {
    this.leftGridSubject.next(leftItems);
    this.rightGridSubject.next(rightItems);
  }

  transferItem(
    item: GridsterItem,
    from: 'left' | 'right',
    to: 'left' | 'right'
  ): void {
    if (from === to) return;

    const sourceItems = from === 'left'
      ? [...this.leftGridSubject.value]
      : [...this.rightGridSubject.value];

    const targetItems = to === 'left'
      ? [...this.leftGridSubject.value]
      : [...this.rightGridSubject.value];

    // Remove from source
    const index = sourceItems.findIndex(i => i.id === item.id);
    if (index > -1) {
      sourceItems.splice(index, 1);
    }

    // Add to target with new position
    const transferredItem = {
      ...item,
      x: 0,  // Reset position
      y: 0
    };
    targetItems.push(transferredItem);

    // Update observables
    if (from === 'left') {
      this.leftGridSubject.next(sourceItems);
    } else {
      this.rightGridSubject.next(sourceItems);
    }

    if (to === 'left') {
      this.leftGridSubject.next(targetItems);
    } else {
      this.rightGridSubject.next(targetItems);
    }
  }

  addItem(grid: 'left' | 'right', item: GridsterItem): void {
    const items = grid === 'left'
      ? [...this.leftGridSubject.value]
      : [...this.rightGridSubject.value];

    items.push(item);

    if (grid === 'left') {
      this.leftGridSubject.next(items);
    } else {
      this.rightGridSubject.next(items);
    }
  }

  removeItem(grid: 'left' | 'right', itemId: string): void {
    const items = grid === 'left'
      ? [...this.leftGridSubject.value]
      : [...this.rightGridSubject.value];

    const index = items.findIndex(i => i.id === itemId);
    if (index > -1) {
      items.splice(index, 1);
    }

    if (grid === 'left') {
      this.leftGridSubject.next(items);
    } else {
      this.rightGridSubject.next(items);
    }
  }
}
```

---

### 5. Panel Content Component

```typescript
// components/panel-content.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-panel-content',
  template: `
    <div [ngSwitch]="type">
      <!-- Stats Panel -->
      <div *ngSwitchCase="'stats'" class="stats-panel">
        <nz-statistic [nzValue]="data?.value || 0" [nzTitle]="data?.title || 'Statistic'">
        </nz-statistic>
      </div>

      <!-- Table Panel -->
      <div *ngSwitchCase="'table'" class="table-panel">
        <nz-table [nzData]="data?.rows || []" [nzPageSize]="5">
          <thead>
            <tr>
              <th *ngFor="let col of data?.columns">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of data?.rows">
              <td *ngFor="let col of data?.columns">{{ row[col] }}</td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <!-- Chart Panel -->
      <div *ngSwitchCase="'chart'" class="chart-panel">
        <!-- Integrate your charting library here -->
        <p>Chart goes here</p>
      </div>

      <!-- Default -->
      <div *ngSwitchDefault>
        <p>Panel type: {{ type }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-panel, .table-panel, .chart-panel {
      width: 100%;
      height: 100%;
    }
  `]
})
export class PanelContentComponent {
  @Input() type: string;
  @Input() data: any;
}
```

---

## Module Registration

```typescript
// app.module.ts (or feature module)
import { GridsterModule } from 'angular-gridster2';

@NgModule({
  imports: [
    GridsterModule,
    // ... other imports
  ]
})
export class AppModule { }
```

---

## Usage Example

```typescript
// Example: Adding a vehicle table panel
addVehicleTable(grid: 'left' | 'right'): void {
  const tablePanel: GridsterItem = {
    cols: 3,
    rows: 2,
    y: 0,
    x: 0,
    id: `vehicle-table-${Date.now()}`,
    panelType: 'table',
    data: {
      columns: ['VIN', 'Make', 'Model', 'Year'],
      rows: [
        { VIN: '1HGCM...', Make: 'Honda', Model: 'Accord', Year: 2020 },
        { VIN: '2HGCM...', Make: 'Toyota', Model: 'Camry', Year: 2021 }
      ]
    }
  };

  this.addPanel(grid, 'table');
}
```

---

## Advanced Features

### 1. Save/Load Workspace Layouts

```typescript
export interface WorkspaceLayout {
  id: string;
  name: string;
  leftGrid: GridsterItem[];
  rightGrid: GridsterItem[];
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceLayoutService {
  saveLayout(name: string, leftGrid: GridsterItem[], rightGrid: GridsterItem[]): void {
    const layout: WorkspaceLayout = {
      id: uuid(),
      name,
      leftGrid,
      rightGrid,
      createdAt: new Date()
    };

    const layouts = this.getLayouts();
    layouts.push(layout);
    localStorage.setItem('workspaceLayouts', JSON.stringify(layouts));
  }

  loadLayout(id: string): WorkspaceLayout | null {
    const layouts = this.getLayouts();
    return layouts.find(l => l.id === id) || null;
  }

  getLayouts(): WorkspaceLayout[] {
    const data = localStorage.getItem('workspaceLayouts');
    return data ? JSON.parse(data) : [];
  }
}
```

### 2. Panel Templates

```typescript
export interface PanelTemplate {
  id: string;
  name: string;
  type: string;
  defaultSize: { cols: number; rows: number };
  config: any;
}

const PANEL_TEMPLATES: PanelTemplate[] = [
  {
    id: 'vehicle-search',
    name: 'Vehicle Search',
    type: 'table',
    defaultSize: { cols: 3, rows: 2 },
    config: {
      columns: ['VIN', 'Make', 'Model', 'Year'],
      filters: ['manufacturer', 'model', 'year']
    }
  },
  {
    id: 'stats-dashboard',
    name: 'Statistics Dashboard',
    type: 'stats',
    defaultSize: { cols: 2, rows: 1 },
    config: {
      metrics: ['total_vehicles', 'total_manufacturers']
    }
  }
];
```

---

## Best Practices

1. **State Management**: Use BehaviorSubject pattern for grid state
2. **Persistence**: Save grid state to localStorage or backend
3. **Performance**: Use `trackBy` functions for `*ngFor` on panels
4. **Responsive**: Configure mobile breakpoints
5. **Accessibility**: Add ARIA labels to drag handles
6. **Visual Feedback**: Highlight drop zones during drag operations

---

## Testing Cross-Grid Drag & Drop

```typescript
describe('GridTransferService', () => {
  let service: GridTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GridTransferService);
  });

  it('should transfer item from left to right grid', (done) => {
    const leftItems: GridsterItem[] = [
      { id: '1', cols: 2, rows: 2, x: 0, y: 0 }
    ];
    const rightItems: GridsterItem[] = [];

    service.setGrids(leftItems, rightItems);

    service.transferItem(leftItems[0], 'left', 'right');

    service.rightGrid$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('1');
      done();
    });
  });
});
```

---

## Conclusion

This implementation provides:
- ✅ Two independent gridster2 grids on the same page
- ✅ Cross-grid drag and drop functionality
- ✅ State management with RxJS
- ✅ Persistence to localStorage
- ✅ Dynamic panel content with NG-ZORRO components
- ✅ Scalable architecture following Angular best practices

The cross-grid drag feature is fully supported by gridster2 with proper configuration and event handling.

---

**Related Documentation**:
- [Angular Architecture](./angular-architecture.md)
- [State Management Patterns](./state-management.md)
- [gridster2 Official Docs](https://github.com/tiberiuzuld/angular-gridster2)
