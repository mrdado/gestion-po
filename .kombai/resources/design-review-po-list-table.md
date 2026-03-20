# Design Review Results: PO List Table

**Review Date**: March 20, 2026
**Route**: `/bons-de-commande`
**Page Component**: `src/components/po/POList.tsx`
**Focus Area**: Visual Design (colors, typography, spacing, aesthetics)

## Summary

The PO List table has a clean, modern structure with proper grid layout and responsive column sizing (recently fixed). However, there are several visual design inconsistencies affecting color usage, typography hierarchy, spacing uniformity, and hover state feedback. The implementation mixes CSS variables with hardcoded Tailwind colors, undermining the design token system. Improvements in text contrast, hover states, and color consistency will enhance both aesthetics and accessibility.

## Issues

| # | Issue | Criticality | Location |
|---|-------|-------------|----------|
| 1 | Hardcoded gray colors used instead of CSS variables (gray-500, gray-400, gray-200, gray-50, gray-700) | 🟡 Medium | `src/components/po/POList.tsx:124, 232, 256, 266, 267` |
| 2 | Header row height inconsistency: headers have `py-3` while data rows have `py-4` | 🟡 Medium | `src/components/po/POList.tsx:180, 205` |
| 3 | Column header text color (--text-tertiary) may have insufficient contrast for readability | 🟠 High | `src/components/po/POList.tsx:185` |
| 4 | Table rows missing visible hover state feedback (hover-surface class applied but no clear effect) | 🟠 High | `src/components/po/POList.tsx:205` |
| 5 | Inconsistent text colors across table cells (mix of --text-primary, --text-secondary, hardcoded gray-500) | 🟡 Medium | `src/components/po/POList.tsx:208, 212, 225, 235, 237, 239` |
| 6 | Vendor name link uses hardcoded `hover:text-emerald-600` instead of theme accent color | 🟡 Medium | `src/components/po/POList.tsx:222` |
| 7 | Three-dot menu button uses hardcoded `hover:bg-gray-200` instead of theme colors | 🟡 Medium | `src/components/po/POList.tsx:256` |
| 8 | Status filter buttons use hardcoded Tailwind colors (bg-gray-50, border-gray-200) instead of CSS variables | 🟡 Medium | `src/components/po/POList.tsx:126, 134, 135` |
| 9 | Vertical divider in filter bar uses hardcoded `bg-gray-200` instead of theme border color | ⚪ Low | `src/components/po/POList.tsx:124` |
| 10 | Import CSV button uses hardcoded `bg-slate-100 text-slate-700` instead of theme secondary colors | 🟡 Medium | `src/components/po/POList.tsx:150` |
| 11 | Missing consistent spacing/padding in column cells (headers and rows have same padding but different heights) | 🟡 Medium | `src/components/po/POList.tsx:180, 205` |
| 12 | Nested column headers in AFFAIRE and PROJECT_TYPE lack visual distinction/hierarchy | ⚪ Low | `src/components/po/POList.tsx:230-233` |

## Criticality Legend

- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

## Recommended Improvements (Priority Order)

### High Priority (Improve Immediately)

1. **Add Visible Row Hover State** (Line 205)
   - Apply subtle background color change on hover
   - Use `hover:bg-[var(--surface-hover)]` for consistency
   - Improves visual feedback and indicates interactivity

2. **Fix Column Header Text Contrast** (Line 185)
   - Change from `var(--text-tertiary)` to `var(--text-secondary)` for better readability
   - Current color (#9CA3AF) may not meet WCAG AA for small text

### Medium Priority (Address Soon)

3. **Replace All Hardcoded Colors with CSS Variables**
   - Replace `bg-gray-200` → `var(--color-border)` (Line 124)
   - Replace `bg-gray-50` → `var(--surface-alt)` (Line 126)
   - Replace `border-gray-200` → `var(--color-border)` (Line 126, 134)
   - Replace `text-gray-500` → `var(--text-secondary)` (Line 232)
   - Replace `text-gray-400` → `var(--text-tertiary)` (Line 267)
   - Replace `hover:text-emerald-600` → `hover:text-[var(--accent)]` (Line 222)
   - Replace `hover:bg-gray-200` → `hover:bg-[var(--surface-hover)]` (Line 256)
   - Improves maintainability and design system adherence

4. **Standardize Text Colors** (Lines 208-239)
   - Po_number, vendor, project_number, amount should use consistent color hierarchy
   - Currently mixed between primary and secondary
   - Recommend: Primary for main data, secondary for meta/supplementary

5. **Update Filter Button Styling** (Lines 126-143)
   - Use CSS variables instead of hardcoded grays
   - Consider using badge or button component from design system
   - Ensure active state is visually distinct

### Low Priority (Nice-to-Have)

6. **Standardize Row Height** (Lines 180, 205)
   - Use consistent padding (`py-4`) for both headers and data rows
   - Or add explicit `h-[44px]` for better alignment

7. **Improve Nested Column Styling** (Lines 230-233)
   - Consider using `.text-xs` for project_type to create visual hierarchy
   - Use `opacity-75` or lighter color to de-emphasize secondary text

## Code Examples

### Example 1: Fix Hardcoded Colors

```typescript
// ❌ BEFORE
<div className="h-6 w-px bg-gray-200 mx-1"></div>

// ✅ AFTER
<div className="h-6 w-px mx-1" style={{ backgroundColor: 'var(--color-border)' }}></div>
```

### Example 2: Add Hover State

```typescript
// ❌ BEFORE
className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 hover-surface relative"

// ✅ AFTER
className="grid items-center px-6 py-4 border-b border-gray-50 last:border-0 relative transition-colors hover:bg-[var(--surface-hover)]"
```

### Example 3: Use Theme Colors

```typescript
// ❌ BEFORE
<button className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">

// ✅ AFTER
<button className="flex items-center gap-3 px-4 py-2 text-sm transition-colors" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--surface)' }} className="hover:bg-[var(--surface-hover)]">
```

## Design System Alignment

**Current State**: The table uses a mix of CSS variables (70%) and hardcoded Tailwind colors (30%)

**Target State**: 100% CSS variable usage for:
- Background colors
- Text colors
- Border colors
- Hover states
- Icon colors

This ensures:
✓ Easy theme switching
✓ Consistent visual language
✓ Better maintainability
✓ Faster design iterations

## Next Steps

1. **Immediate**: Add row hover state and fix header contrast
2. **Short-term**: Replace all hardcoded colors with CSS variables
3. **Verification**: Take screenshots after changes to verify visual improvements
4. **Testing**: Verify contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
