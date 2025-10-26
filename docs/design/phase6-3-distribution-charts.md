# Phase 6.3: Distribution Charts (PlotlyJS Integration)

**Status**: 📋 Planned
**Priority**: 🟠 MEDIUM (High visual impact, analytics value)
**Effort Estimate**: 8 hours
**Dependencies**: None
**Inspired By**: Aircraft Registry application histograms

---

## Problem Statement

### Current Limitations
1. **Text-Only Stats**: Home page shows numbers but no visual representation
2. **No Data Exploration**: Users can't see distribution patterns at a glance
3. **Missing Insights**: No way to identify dominant manufacturers or popular body classes
4. **Low Engagement**: Static numbers don't invite exploration

### User Impact
- **Analysts** need visual distribution data
- **Decision makers** want quick insights
- **Casual users** miss interesting dataset patterns

---

## Solution Overview

Add interactive bar charts using **PlotlyJS** to visualize vehicle distributions by manufacturer and body class, providing immediate visual insights into the dataset composition.

---

## Technical Design

### 1. Install angular-plotly.js

```bash
npm install --save plotly.js-dist-min angular-plotly.js
```

```typescript
// frontend/src/app/app.module.ts

import { PlotlyViaCDNModule } from 'angular-plotly.js';

// Or for self-hosted Plotly:
// import * as PlotlyJS from 'plotly.js-dist-min';
// import { PlotlyModule } from 'angular-plotly.js';
// PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  imports: [
    // ... existing imports
    PlotlyViaCDNModule  // Use CDN version (smaller bundle)
  ]
})
export class AppModule { }
```

### 2. Create Reusable Chart Component

```typescript
// frontend/src/app/shared/components/distribution-chart/distribution-chart.component.ts

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

export interface ChartDataPoint {
  name: string;
  count: number;
}

@Component({
  selector: 'app-distribution-chart',
  template: `
    <plotly-plot
      [data]="chartData"
      [layout]="chartLayout"
      [config]="chartConfig"
      [style]="{ width: '100%', height: height + 'px' }"
      (click)="onChartClick($event)">
    </plotly-plot>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DistributionChartComponent implements OnInit {
  @Input() title = 'Distribution';
  @Input() data: ChartDataPoint[] = [];
  @Input() height = 400;
  @Input() color = '#1890ff';
  @Input() limit = 10; // Show top N items
  @Input() clickable = false;

  @Output() barClick = new EventEmitter<string>();

  chartData: any[] = [];
  chartLayout: any = {};
  chartConfig: any = {
    responsive: true,
    displayModeBar: false,
    displaylogo: false
  };

  ngOnInit(): void {
    this.buildChart();
  }

  ngOnChanges(): void {
    this.buildChart();
  }

  private buildChart(): void {
    // Limit to top N items
    const limitedData = this.data
      .slice(0, this.limit)
      .sort((a, b) => b.count - a.count); // Descending order

    this.chartData = [{
      x: limitedData.map(d => d.name),
      y: limitedData.map(d => d.count),
      type: 'bar',
      marker: {
        color: this.color,
        line: {
          color: '#096dd9',
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>Count: %{y}<extra></extra>',
      text: limitedData.map(d => d.count),
      textposition: 'outside',
      textfont: {
        size: 12
      }
    }];

    this.chartLayout = {
      title: {
        text: this.title,
        font: { size: 16, family: 'Arial, sans-serif' }
      },
      xaxis: {
        title: '',
        tickangle: -45,
        automargin: true
      },
      yaxis: {
        title: 'Count',
        gridcolor: '#f0f0f0'
      },
      margin: {
        t: 60,
        r: 20,
        b: 100,
        l: 60
      },
      plot_bgcolor: '#fafafa',
      paper_bgcolor: '#ffffff'
    };
  }

  onChartClick(event: any): void {
    if (this.clickable && event.points && event.points.length > 0) {
      const clickedName = event.points[0].x;
      this.barClick.emit(clickedName);
    }
  }
}
```

### 3. Update Backend Stats Endpoint

Add manufacturer distribution to stats response:

```typescript
// backend/src/services/vehicle.service.ts

async getStats(): Promise<Stats> {
  const aggs = await this.esClient.search({
    index: config.elasticsearch.index,
    size: 0,
    body: {
      aggs: {
        total_vehicles: { value_count: { field: 'vehicle_id.keyword' } },
        manufacturers: {
          cardinality: { field: 'manufacturer.keyword' }
        },
        manufacturer_distribution: {
          terms: {
            field: 'manufacturer.keyword',
            size: 100,  // Get top 100
            order: { _count: 'desc' }
          }
        },
        body_class_distribution: {
          terms: {
            field: 'body_class.keyword',
            size: 50,
            order: { _count: 'desc' }
          }
        }
      }
    }
  });

  return {
    total_vehicles: aggs.aggregations.total_vehicles.value,
    total_manufacturers: aggs.aggregations.manufacturers.value,
    manufacturer_distribution: aggs.aggregations.manufacturer_distribution.buckets.map(b => ({
      name: b.key,
      count: b.doc_count
    })),
    body_class_distribution: aggs.aggregations.body_class_distribution.buckets.map(b => ({
      name: b.key || 'Unknown',
      count: b.doc_count
    }))
  };
}
```

Update Stats interface:

```typescript
// frontend/src/app/core/models/stats.model.ts

export interface Stats {
  total_vehicles: number;
  total_manufacturers: number;
  manufacturer_distribution: Array<{
    name: string;
    count: number;
  }>;
  body_class_distribution: Array<{
    name: string;
    count: number;
  }>;
}
```

### 4. Update Home Component

```html
<!-- frontend/src/app/pages/home/home.component.html -->

<div class="home-container">
  <nz-page-header nzTitle="Classic Vehicle Discovery">
    <nz-page-header-subtitle>
      Explore {{ (stats$ | async)?.total_vehicles || 0 | number }} classic automobiles
      from {{ (stats$ | async)?.total_manufacturers || 0 }} manufacturers
    </nz-page-header-subtitle>
  </nz-page-header>

  <!-- Charts Section -->
  <div *ngIf="stats$ | async as stats">
    <nz-row [nzGutter]="16" style="margin-top: 24px;">
      <!-- Manufacturer Distribution Chart -->
      <nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
        <nz-card nzTitle="Top 10 Manufacturers" [nzExtra]="manufacturerExtra">
          <app-distribution-chart
            [title]="'Vehicles by Manufacturer'"
            [data]="stats.manufacturer_distribution"
            [limit]="10"
            [color]="'#1890ff'"
            [clickable]="true"
            (barClick)="onManufacturerClick($event)">
          </app-distribution-chart>
        </nz-card>
        <ng-template #manufacturerExtra>
          <a routerLink="/discover">Explore All →</a>
        </ng-template>
      </nz-col>

      <!-- Body Class Distribution Chart -->
      <nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
        <nz-card nzTitle="Vehicle Types" [nzExtra]="bodyClassExtra">
          <app-distribution-chart
            [title]="'Body Class Distribution'"
            [data]="stats.body_class_distribution"
            [limit]="10"
            [color]="'#52c41a'"
            [clickable]="true"
            (barClick)="onBodyClassClick($event)">
          </app-distribution-chart>
        </nz-card>
        <ng-template #bodyClassExtra>
          <a routerLink="/discover">Explore All →</a>
        </ng-template>
      </nz-col>
    </nz-row>

    <!-- Summary Stats Cards (Keep existing) -->
    <nz-row [nzGutter]="16" style="margin-top: 16px;">
      <nz-col [nzSpan]="8">
        <nz-statistic
          [nzValue]="stats.total_vehicles"
          nzTitle="Total Vehicles">
        </nz-statistic>
      </nz-col>
      <nz-col [nzSpan]="8">
        <nz-statistic
          [nzValue]="stats.total_manufacturers"
          nzTitle="Manufacturers">
        </nz-statistic>
      </nz-col>
      <nz-col [nzSpan]="8">
        <nz-statistic
          [nzValue]="stats.body_class_distribution.length"
          nzTitle="Body Classes">
        </nz-statistic>
      </nz-col>
    </nz-row>
  </div>
</div>
```

```typescript
// frontend/src/app/pages/home/home.component.ts

export class HomeComponent {
  stats$ = this.vehicleService.getStats();

  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) {}

  onManufacturerClick(manufacturer: string): void {
    // Navigate to Discover page with manufacturer pre-selected
    this.router.navigate(['/discover'], {
      queryParams: { manufacturers: manufacturer }
    });
  }

  onBodyClassClick(bodyClass: string): void {
    // Navigate to Discover page with body class pre-selected
    this.router.navigate(['/discover'], {
      queryParams: { body_classes: bodyClass }
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('DistributionChartComponent', () => {
  it('should render chart with data', () => {
    component.data = [
      { name: 'Buick', count: 27 },
      { name: 'Cadillac', count: 15 }
    ];
    component.ngOnInit();

    expect(component.chartData[0].x).toEqual(['Buick', 'Cadillac']);
    expect(component.chartData[0].y).toEqual([27, 15]);
  });

  it('should limit to top N items', () => {
    component.data = Array.from({ length: 20 }, (_, i) => ({
      name: `Manufacturer ${i}`,
      count: 100 - i
    }));
    component.limit = 10;
    component.ngOnInit();

    expect(component.chartData[0].x.length).toBe(10);
  });

  it('should emit barClick event when clicked', () => {
    component.clickable = true;
    spyOn(component.barClick, 'emit');

    component.onChartClick({
      points: [{ x: 'Buick', y: 27 }]
    });

    expect(component.barClick.emit).toHaveBeenCalledWith('Buick');
  });
});
```

### Manual Testing Checklist

- [ ] Charts render on Home page without errors
- [ ] Manufacturer chart shows top 10 manufacturers
- [ ] Body class chart shows top 10 body classes
- [ ] Hover tooltips display correctly
- [ ] Click manufacturer bar → navigates to Discover with filter
- [ ] Charts resize responsively (mobile, tablet, desktop)
- [ ] Loading state handled gracefully
- [ ] Charts match NG-ZORRO color scheme (#1890ff, #52c41a)

---

## Bundle Size Impact

**PlotlyJS Impact**:
- plotly.js-dist-min: ~3.5 MB uncompressed, ~1 MB gzipped
- Using CDN version (PlotlyViaCDNModule) avoids bundle bloat
- OR: Tree-shake with plotly.js-basic-dist (~1 MB, bar charts only)

**Recommendation**:
- Use CDN for production (no bundle impact)
- Use basic dist for offline deployments

---

## Success Criteria

- [ ] PlotlyJS charts render correctly on Home page
- [ ] Charts show manufacturer and body class distributions
- [ ] Hover tooltips display exact counts
- [ ] Click chart bar → navigates to Discover with filter applied
- [ ] Charts are responsive (mobile, tablet, desktop)
- [ ] Charts match NG-ZORRO color scheme
- [ ] Loading states handled gracefully
- [ ] No bundle size increase (if using CDN)
- [ ] All existing tests pass

---

## Future Enhancements

1. **Additional Charts**:
   - Year distribution (line chart or histogram)
   - Data source distribution (pie chart)
   - Top manufacturers by year (stacked bar)

2. **Interactivity**:
   - Zoom/pan for large datasets
   - Multi-select bars (Ctrl+Click)
   - Download chart as PNG

3. **Analytics Page**:
   - Dedicated page with 6-8 charts
   - Customizable chart selection
   - Dashboard layout (Phase 6.5)

---

## References

- Aircraft Registry screenshots (histogram examples)
- PlotlyJS Documentation: https://plotly.com/javascript/
- angular-plotly.js: https://github.com/plotly/angular-plotly.js
- NG-ZORRO Card: https://ng.ant.design/components/card/en
