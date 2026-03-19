# Design Review Results: Dashboard (`/`)

**Review Date**: 2026-03-19  
**Route**: `/`  
**Focus Areas**: Visual Design, UX/Usability, Accessibility, Micro-interactions/Motion, Consistency, Performance

> **Note**: This review was conducted through static code analysis only. Visual inspection via browser would provide additional insights into layout rendering, interactive behaviors, actual contrast ratios, and visual appearance.

## Summary

The dashboard is a well-structured Purchase Order management interface with KPI cards, spend analytics charts, and recent PO listings. However, it has notable issues across accessibility, consistency, performance, and micro-interactions that impact user experience and maintainability. The implementation mixes design tokens with hardcoded values, lacks proper ARIA labeling on interactive elements, fetches excessive data without pagination, and relies on inline styles that diverge from the Tailwind-based design system. Key strengths include clear information hierarchy, responsive grid layout, and comprehensive data visualization.

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | Dropdown (timeframe selector) lacks `aria-label` and visual active state indication; essential for accessibility and UX clarity | 🔴 Critical | Accessibility, UX/Usability | `src/components/dashboard/Dashboard.tsx:220-230` |
| 2 | Icon buttons (Bell, Chat) in PageHeader have no `aria-label`, `title`, or focus-visible styling; fails WCAG 2.1 requirement for button labels | 🔴 Critical | Accessibility | `src/components/layout/PageHeader.tsx:68-80` |
| 3 | Fetches ALL purchase orders without limit/pagination (`select('*, vendors(name)')` at line 74-77); causes performance degradation and blocks interaction on large datasets | 🔴 Critical | Performance | `src/components/dashboard/Dashboard.tsx:74-77` |
| 4 | Trend colors (#16A34A green, #DC2626 red at lines 34, 36) lack documented contrast ratio verification against white background; may fail WCAG AA 4.5:1 requirement | 🟠 High | Accessibility | `src/components/dashboard/Dashboard.tsx:32-38` |
| 5 | Timeframe selector uses hardcoded Tailwind colors (bg-gray-50, border-gray-200, text-gray-600) instead of CSS variables; breaks design token system | 🟠 High | Visual Design, Consistency | `src/components/dashboard/Dashboard.tsx:223` |
| 6 | Status breakdown pie chart uses only color for differentiation (line 256-258) without accompanying text/legend in chart itself; violates WCAG color-alone rule | 🟠 High | Accessibility | `src/components/dashboard/Dashboard.tsx:256-258` |
| 7 | Sidebar nav links have `title` attribute but missing `aria-current="page"` on active link; fails semantic navigation landmark requirement | 🟠 High | Accessibility | `src/components/layout/Sidebar.tsx:49-62` |
| 8 | Inline style props for icon backgrounds (`style={{ backgroundColor: iconBg }}`) mixed with Tailwind classes; inconsistent with design system and difficult to theme | 🟠 High | Consistency | `src/components/dashboard/Dashboard.tsx:25-26` |
| 9 | Trend calculations, status breakdown, and spend history recalculated on every render without useMemo; unnecessary re-renders impact performance | 🟡 Medium | Performance | `src/components/dashboard/Dashboard.tsx:111-115, 121-163` |
| 10 | `formatCurrency()` function called directly in JSX without memoization; recalculates values on every render for KPI cards, bars, and legend items | 🟡 Medium | Performance | `src/components/dashboard/Dashboard.tsx:237, 261, 295` |
| 11 | Hover state on recent PO items uses hardcoded `hover:bg-gray-50` instead of theme variable; breaks dark mode support and consistency | 🟡 Medium | Consistency, Visual Design | `src/components/dashboard/Dashboard.tsx:287` |
| 12 | Empty state text (line 284: "Aucune commande récente trouvée") uses italic and gray color; low prominence for important user feedback | 🟡 Medium | UX/Usability | `src/components/dashboard/Dashboard.tsx:283-284` |
| 13 | Sidebar nav items use `onMouseEnter`/`onMouseLeave` with inline style changes; no CSS transitions for smooth hover animation | 🟡 Medium | Micro-interactions/Motion | `src/components/layout/Sidebar.tsx:57-58` |
| 14 | Recent POs list shows only 5 items with no pagination, "load more", or visible indication of truncation; hides data and limits UX | 🟡 Medium | UX/Usability | `src/components/dashboard/Dashboard.tsx:168` |
| 15 | Mock trend data hardcoded (`openTrend: '+8%'`, `billedTrend: '+12%'`, `spendTrend: '+15%'` at lines 97-99); dashboard is non-functional for real analytics | 🟡 Medium | UX/Usability | `src/components/dashboard/Dashboard.tsx:97-99` |
| 16 | Filters (status, date ranges) applied in JavaScript after full fetch instead of DB WHERE clauses; inefficient for large datasets | ⚪ Low | Performance | `src/components/dashboard/Dashboard.tsx:86, 91-95, 128-151` |
| 17 | Icon colors applied via inline `style` prop instead of Tailwind color utilities; harder to maintain and theme consistently | ⚪ Low | Consistency | `src/components/dashboard/Dashboard.tsx:26, 29, 31, 34, 36, 41, 250` |
| 18 | No loading skeleton or progressive rendering for chart sections; only full-page spinner shown until all data loads | ⚪ Low | Micro-interactions/Motion | `src/components/dashboard/Dashboard.tsx:184-190` |
| 19 | Pie chart legend uses 2-column grid layout (line 264) without explicit responsive handling; may overflow on smaller screens | ⚪ Low | Responsive/Mobile | `src/components/dashboard/Dashboard.tsx:264` |
| 20 | Search input in PageHeader has placeholder but no visible label element; could be improved for screen reader clarity | ⚪ Low | Accessibility | `src/components/layout/PageHeader.tsx:54-61` |

## Criticality Legend

- 🔴 **Critical**: Breaks functionality, violates accessibility standards (WCAG), or causes significant performance issues
- 🟠 **High**: Significantly impacts user experience, design quality, or system consistency
- 🟡 **Medium**: Noticeable issue that should be prioritized in next sprint
- ⚪ **Low**: Nice-to-have improvement or minor inconsistency

## Next Steps

### Immediate (Sprint Priority)

1. **Fix Accessibility (Issues #2, #4, #7)**: Add `aria-label` to all icon buttons and form controls; verify trend color contrast ratios; add `aria-current="page"` to active navigation links.
2. **Implement Pagination (Issue #3)**: Add `.limit(10)` to Supabase query and implement pagination/infinite scroll for PO list instead of fetching all records.
3. **Unify Design Tokens (Issues #5, #8, #11)**: Replace hardcoded Tailwind colors and inline styles with CSS variables (`var(--accent)`, `var(--surface-alt)`, etc.) from the design system.

### Short-term (Next Sprint)

4. **Optimize Performance (Issues #9, #10, #16)**: 
   - Wrap `statusBreakdown`, `spendHistory`, and `formatCurrency` calls with `useMemo`
   - Move filter/sort logic to Supabase queries using WHERE/ORDER BY
   - Consider skeleton loaders for chart sections during loading

5. **Enhance Micro-interactions (Issues #13, #18)**: 
   - Add CSS transitions to sidebar hover states
   - Implement skeleton loaders for chart sections
   - Smooth bar chart animations on mount using Recharts `isAnimationActive`

6. **Improve UX (Issues #12, #14, #15)**:
   - Replace mock trends with real data calculations
   - Add "View All" link or pagination to recent POs
   - Improve empty state styling and messaging

### Long-term (Design System Refinement)

7. **Establish Consistency Standards**: Document icon sizing conventions, spacing rhythm, and color token usage across all pages to prevent similar issues in future features.

## Strengths

- **Clear Information Hierarchy**: KPI cards, charts, and recent POs are well-organized and scannable
- **Responsive Grid Layout**: Dashboard uses flexible grid with `grid-cols-3` and `col-span-2` for good adaptive layout
- **Comprehensive Data Visualization**: Recharts integration with multiple timeframe options (days, weeks, months, years) provides valuable insights
- **French Localization**: Proper use of `date-fns` French locale for date formatting
- **Component Reusability**: KpiCard sub-component reduces code duplication

## Recommendations

1. **Establish a Design Tokens Audit**: Audit all hardcoded colors, spacing, and sizes; migrate to CSS variables from `index.css`
2. **Create ARIA Label Guidelines**: Document required accessibility attributes for common patterns (buttons, dropdowns, navigation)
3. **Performance Monitoring**: Implement React Profiler checks for large datasets; set performance budgets for chart rendering
4. **Accessibility Testing**: Use axe DevTools or WAVE to validate WCAG compliance before release; test keyboard navigation
