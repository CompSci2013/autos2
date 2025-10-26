# Phase 6.4: Expandable/Collapsible Filter Panels

**Status**: 📋 Planned
**Priority**: 🟢 MEDIUM (Clean UI, progressive disclosure)
**Effort Estimate**: 4 hours
**Dependencies**: Works best after Phase 6.1 (multi-select filters)
**Inspired By**: Aircraft Registry application accordion panels

---

## Problem Statement

### Current Limitations
1. **Cluttered UI**: All filters always visible, creating visual noise
2. **Poor Scalability**: Adding more filters makes page longer
3. **No Progressive Disclosure**: Can't hide less-used filters
4. **Missing Context**: No indication of active filter counts per section

### User Impact
- **New users** overwhelmed by filter options
- **Power users** waste vertical space
- **Mobile users** must scroll excessively

---

## Solution Overview

Organize filters into **NG-ZORRO accordion panels** (nz-collapse) with expand/collapse functionality, showing active filter counts in panel headers.

---

## Quick Implementation Guide

### 1. Wrap Filters in Accordion

```html
<nz-card nzTitle="Search Filters">
  <!-- Expand/Collapse All Buttons -->
  <div slot="extra" style="display: flex; gap: 8px;">
    <button nz-button nzSize="small" (click)="expandAll()">
      <i nz-icon nzType="plus-square"></i> Expand All
    </button>
    <button nz-button nzSize="small" (click)="collapseAll()">
      <i nz-icon nzType="minus-square"></i> Collapse All
    </button>
  </div>

  <nz-collapse [nzBordered]="false" [(nzActiveKey)]="activePanels">

    <!-- Manufacturer + Model Panel -->
    <nz-collapse-panel
      [nzHeader]="getFilterPanelHeader('Manufacturer + Model')"
      nzKey="1">
      <!-- Existing manufacturer/model checkboxes here -->
    </nz-collapse-panel>

    <!-- Year Range Panel -->
    <nz-collapse-panel
      [nzHeader]="getFilterPanelHeader('Year Range')"
      nzKey="2">
      <!-- Year range selector here -->
    </nz-collapse-panel>

    <!-- Body Class Panel -->
    <nz-collapse-panel
      [nzHeader]="getFilterPanelHeader('Body Class')"
      nzKey="3">
      <!-- Body class checkboxes here -->
    </nz-collapse-panel>

    <!-- Additional Filters Panel (Future) -->
    <nz-collapse-panel
      [nzHeader]="getFilterPanelHeader('Advanced')"
      nzKey="4"
      [nzActive]="false">
      <!-- Data source, ingestion date, etc. -->
    </nz-collapse-panel>

  </nz-collapse>

  <!-- Apply/Clear buttons (outside accordion) -->
  <div style="margin-top: 16px;">
    <!-- Existing Apply/Clear buttons -->
  </div>
</nz-collapse>
```

### 2. Panel State Management

```typescript
export class DiscoverComponent {
  // Active panel keys (persisted to localStorage)
  activePanels: string[] = ['1']; // Default: Manufacturer panel open

  ngAfterViewInit(): void {
    // Restore panel state from localStorage
    const savedPanels = localStorage.getItem('autos2.discover.panels');
    if (savedPanels) {
      this.activePanels = JSON.parse(savedPanels);
    }
  }

  ngOnDestroy(): void {
    // Save panel state to localStorage
    localStorage.setItem('autos2.discover.panels', JSON.stringify(this.activePanels));
  }

  expandAll(): void {
    this.activePanels = ['1', '2', '3', '4'];
  }

  collapseAll(): void {
    this.activePanels = [];
  }

  getFilterPanelHeader(baseName: string): string {
    const count = this.getActiveFilterCount(baseName);
    return count > 0 ? `${baseName} (${count})` : baseName;
  }

  getActiveFilterCount(panelName: string): number {
    const filters = this.appliedFilters$.value;
    switch (panelName) {
      case 'Manufacturer + Model':
        return (filters.manufacturers?.length || 0) + (filters.models?.length || 0);
      case 'Year Range':
        return (filters.year_min || filters.year_max) ? 1 : 0;
      case 'Body Class':
        return filters.body_classes?.length || 0;
      default:
        return 0;
    }
  }
}
```

### 3. Styling Enhancements

```scss
// discover.component.scss

::ng-deep {
  .ant-collapse {
    background: transparent;

    .ant-collapse-item {
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .ant-collapse-header {
      padding: 12px 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);

      // Highlight panels with active filters
      &.has-active-filters {
        background: #e6f7ff;
        border-left: 3px solid #1890ff;
      }
    }

    .ant-collapse-content {
      padding: 16px;
      background: #fafafa;
    }
  }
}
```

---

## Success Criteria

- [ ] Filters organized into logical accordion panels
- [ ] Panel headers show active filter counts (e.g., "Manufacturer + Model (3)")
- [ ] Expand All / Collapse All buttons work
- [ ] Panel open/closed state persists to localStorage
- [ ] Default state: Manufacturer panel open, others closed
- [ ] Panels with active filters highlighted visually
- [ ] Smooth expand/collapse animations
- [ ] Mobile-friendly (collapsible saves vertical space)

---

## Testing Checklist

- [ ] Open/close panels manually → state persists on refresh
- [ ] Click Expand All → all panels open
- [ ] Click Collapse All → all panels close
- [ ] Apply filters → count appears in panel header
- [ ] Panel with active filters highlighted with blue left border
- [ ] Works on mobile (touch events)
- [ ] Keyboard navigation (Enter/Space to toggle)

---

## References

- Aircraft Registry screenshots (expandable filter panels)
- NG-ZORRO Collapse: https://ng.ant.design/components/collapse/en
