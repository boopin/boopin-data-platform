# Dashboard Enhancement Plan

## Features to Implement

### 1. Enhanced Date Filtering ✅
- [x] Add custom date range picker (from/to dates)
- [ ] Implement in UI
- [ ] Update API to handle custom date ranges

### 2. Source/Medium Traffic Breakdown ✅
- [ ] Add API endpoint for detailed source/medium breakdown
- [ ] Create UI section for source/medium table
- [ ] Add source and medium filter dropdowns
- [ ] Show conversion metrics per source/medium

### 3. Enhanced Export Functionality ✅
- [ ] Include all applied filters in export filename
- [ ] Add more columns: utm_source, utm_medium, utm_campaign, referrer
- [ ] Add JSON export option alongside CSV
- [ ] Add export configuration modal (select columns, format)

## Implementation Steps

### Phase 1: API Enhancements
1. Update `/api/dashboard` route to include:
   - `sourceAndMediumBreakdown` query
   - Custom date range support (dateFrom, dateTo)
   - Source filter parameter
   - Medium filter parameter

### Phase 2: UI Enhancements
1. Add date range inputs (from/to) to filter bar
2. Add source dropdown filter
3. Add medium dropdown filter
4. Create Source/Medium breakdown section with table
5. Enhance export button with options (CSV/JSON, column selection)

### Phase 3: Testing
1. Test all filter combinations
2. Test exports with various filters
3. Test source/medium breakdown accuracy
4. Test date range edge cases

## Files to Modify

1. `/src/app/api/dashboard/route.ts` - API enhancements
2. `/src/app/page.tsx` - Dashboard UI enhancements
3. Create new component: `/src/components/DateRangePicker.tsx` (optional)
4. Create new component: `/src/components/ExportModal.tsx` (optional)
