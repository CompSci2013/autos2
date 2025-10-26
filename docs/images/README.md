# Autos2 Reference Screenshots

This directory contains screenshots from various applications demonstrating UX patterns and features.

## Original Autos Application (Phase 6 Reference)

These screenshots from the original Autos application demonstrate key UX patterns for Phase 6 implementation:

### Home & Discover Pages
- **autos-orig-01-home-page.png** - Home page with "Discover Vehicles" and "Workshop Layout" cards
- **autos-orig-02-discover-empty-picker.png** - Discover page with empty manufacturer/model picker
- **autos-orig-03-discover-multi-select-expanded.png** - Discover page showing Brammo expanded with model checkboxes (Dual Sport, Touring selected)
- **autos-orig-04-discover-multi-select-applied.png** - Results page after applying filters, showing "Active Filters: 2 model(s) selected" with removable tags

### Expandable Row Pattern
- **autos-orig-05-expandable-row-with-vin-data.png** - Expanded vehicle row showing nested VIN data table with condition stars, mileage, state, color, estimated value

### Workshop Pages
- **autos-orig-06-workshop-picker-empty-results.png** - Workshop with picker panel showing manufacturers, empty results panel on right
- **autos-orig-07-workshop-picker-expanded-models.png** - Workshop with Brammo expanded showing model checkboxes
- **autos-orig-08-workshop-dual-panel-expanded-vin.png** - Workshop with picker on left, results table on right showing expanded VIN data
- **autos-orig-09-workshop-dual-panel-results.png** - Workshop dual panel layout with active filters and results
- **autos-orig-10-workshop-picker-collapsed.png** - Workshop with manufacturers collapsed showing model counts

### Advanced Table Features
- **autos-orig-workshop-expanded-synthetic-vin.png** - Workshop showing expanded row with synthetic VIN data (8 instances)
- **autos-orig-manage-columns-dialog.png** - Column visibility management dialog showing drag-and-drop reordering
- **autos-orig-workshop-column-reorder.png** - Results table with reordered columns (Vehicle ID moved to first position)
- **autos-orig-workshop-columns-hidden.png** - Results table with hidden columns (Manufacturer and Body Class hidden)
- **autos-orig-picker-expand-all.png** - Picker showing multiple manufacturers expanded simultaneously
- **autos-orig-picker-collapse-all.png** - Picker showing all manufacturers collapsed after selection

**Key Phase 6 Features Demonstrated:**
- **Phase 6.1 (Multi-Select Filters)**: Screenshots 03 and 04 show checkbox-based selection with "Apply" button pattern
- **Phase 6.4 (Expandable Panels)**: Screenshot 05 shows expandable row pattern with nested VIN data
- **Phase 6.5 (Customizable Dashboard)**: Screenshots 06-10 show drag-and-drop panel layout with resizable sections

**Additional Features:**
- Dynamic column visibility management
- Column reordering via drag-and-drop
- Expand All / Collapse All functionality in hierarchical picker
- Synthetic VIN data generation for testing

## Aircraft Registry Application

- **aircraft-registry-search-with-charts.png** - Search interface with PlotlyJS distribution charts at bottom showing "Aircraft by Manufacturer" and "Models by Manufacturer"

**Key Feature Demonstrated:**
- **Phase 6.3 (Distribution Charts)**: Bottom section shows horizontal bar charts for data visualization

## TLE Satellite Tracker Application

These screenshots are from an unrelated TLE (Two-Line Element) Satellite Tracker application:

- **tle-satellite-list-view.png** - Main list view showing tracked satellites with NORAD ID, name, coordinates, altitude, period
- **tle-satellite-detail-page.png** - Detail view for GSAT0226 (GALILEO 31) showing satellite information, current position, and TLE data
- **tle-satellite-statistics-page.png** - Statistics dashboard with metric cards (865 active satellites, 1723 total records, database size, index count)

## Usage

When implementing Phase 6 features, reference these screenshots to ensure UX consistency with the original application patterns:

1. **Multi-Select Filters (Phase 6.1)**: Use autos-orig-03 and 04 for checkbox pattern and tag display
2. **Expandable Rows (Phase 6.4)**: Use autos-orig-05 for nested data display pattern
3. **Distribution Charts (Phase 6.3)**: Use aircraft-registry screenshot for PlotlyJS chart examples
4. **Customizable Dashboard (Phase 6.5)**: Use autos-orig-06 through 10 for panel layout patterns

## File Naming Convention

- `autos-orig-XX-*.png` - Original Autos application screenshots (numbered 01-10 for main workflow)
- `autos-orig-*.png` - Original Autos application advanced features (column management, picker controls)
- `aircraft-registry-*.png` - Aircraft Registry application screenshots
- `tle-*.png` - TLE Satellite Tracker application screenshots
