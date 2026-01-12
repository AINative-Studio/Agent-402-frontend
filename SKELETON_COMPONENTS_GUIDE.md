# Skeleton Components - Developer Guide

## Quick Reference

### Import

```tsx
import { 
  SkeletonBase, 
  SkeletonText,
  SkeletonCard, 
  SkeletonCardGrid,
  SkeletonTable, 
  SkeletonTableCompact,
  SkeletonList, 
  SkeletonListItem,
  SkeletonListCard 
} from '../components/skeletons';
```

---

## Component API

### SkeletonBase

Basic skeleton element with shimmer animation.

```tsx
<SkeletonBase 
  width={200}        // number (px) or string ("50%")
  height={40}        // number (px) or string
  circle={false}     // boolean - makes skeleton circular
  className=""       // additional CSS classes
/>
```

**Examples:**

```tsx
// Fixed size
<SkeletonBase width={200} height={20} />

// Percentage width
<SkeletonBase width="60%" height={24} />

// Circle (avatar)
<SkeletonBase width={48} height={48} circle />
```

---

### SkeletonText

Multiple lines of text skeleton.

```tsx
<SkeletonText 
  lines={3}              // number of lines
  lastLineWidth="80%"    // width of last line
  className=""           // additional CSS classes
/>
```

**Example:**

```tsx
<SkeletonText lines={2} lastLineWidth="60%" />
```

---

### SkeletonCard

Card-style skeleton with header and content.

```tsx
<SkeletonCard 
  showHeader={true}   // show header with icon and title
  showFooter={false}  // show footer with action buttons
  rows={3}            // number of content rows
  className=""        // additional CSS classes
/>
```

**Example:**

```tsx
// Simple card
<SkeletonCard rows={3} />

// Card with header and footer
<SkeletonCard showHeader showFooter rows={2} />
```

---

### SkeletonCardGrid

Grid of skeleton cards.

```tsx
<SkeletonCardGrid 
  count={6}         // number of cards
  columns={2}       // 1, 2, 3, or 4 columns
  className=""      // additional CSS classes
/>
```

**Example:**

```tsx
// 4-column grid with 8 cards
<SkeletonCardGrid count={8} columns={4} />
```

---

### SkeletonTable

Full table skeleton with header and rows.

```tsx
<SkeletonTable 
  rows={5}           // number of data rows
  columns={4}        // number of columns
  showHeader={true}  // show table header
  className=""       // additional CSS classes
/>
```

**Example:**

```tsx
<SkeletonTable rows={10} columns={5} />
```

---

### SkeletonTableCompact

Compact list-style table rows.

```tsx
<SkeletonTableCompact 
  rows={5}        // number of rows
  className=""    // additional CSS classes
/>
```

**Example:**

```tsx
<SkeletonTableCompact rows={3} />
```

---

### SkeletonList

Simple list with items.

```tsx
<SkeletonList 
  items={5}          // number of list items
  showIcon={true}    // show icon before text
  showAction={false} // show action button
  divided={true}     // add dividers between items
  className=""       // additional CSS classes
/>
```

**Example:**

```tsx
<SkeletonList items={5} showIcon showAction />
```

---

### SkeletonListCard

Card-based list items.

```tsx
<SkeletonListCard 
  items={3}       // number of cards
  className=""    // additional CSS classes
/>
```

**Example:**

```tsx
<SkeletonListCard items={3} />
```

---

## Common Usage Patterns

### Page Loading State

```tsx
function MyPage() {
  const { data, isLoading } = useQuery();
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonBase height={32} width="40%" />
        <SkeletonListCard items={3} />
      </div>
    );
  }
  
  return <div>{/* actual content */}</div>;
}
```

### Table Loading State

```tsx
if (isLoading) {
  return <SkeletonTable rows={10} columns={5} />;
}
```

### Card Grid Loading State

```tsx
if (isLoading) {
  return <SkeletonCardGrid count={8} columns={4} />;
}
```

### Custom Skeleton Layout

```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBase circle width={40} height={40} />
        <div className="flex-1">
          <SkeletonBase height={20} width="60%" className="mb-2" />
          <SkeletonBase height={16} width="40%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
```

### Button Loading State

```tsx
<button
  disabled={isPending}
  className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
  {isPending ? 'Loading...' : 'Submit'}
</button>
```

---

## Best Practices

1. **Match Content Structure**
   - Skeleton should roughly match the actual content layout
   - Use similar spacing and sizing

2. **Show Context**
   - Keep page headers visible during loading
   - Show navigation and key UI elements

3. **Consistent Timing**
   - Use same shimmer animation speed everywhere
   - Don't customize animation timing per component

4. **Accessibility**
   - Skeletons include proper ARIA labels automatically
   - No additional accessibility work needed

5. **Performance**
   - Skeletons are lightweight
   - Safe to render many at once
   - No performance impact on animations

---

## Styling

All skeleton components use the project's color system:

- **Background:** `bg-gray-700/50`
- **Shimmer:** `rgba(255, 255, 255, 0.08)`
- **Animation:** 2-second loop

To customize individual skeletons:

```tsx
<SkeletonBase 
  className="bg-blue-500/20"  // custom background
  width="100%" 
  height={40} 
/>
```

---

## Animation Details

The shimmer effect is created with:

1. **CSS Gradient:** Translucent white overlay
2. **Transform Animation:** Moves left to right
3. **Duration:** 2 seconds
4. **Loop:** Infinite
5. **Easing:** Linear

The animation is defined globally in `/src/index.css` and applied automatically to all skeleton components.

---

## Component File Sizes

- `SkeletonBase.tsx`: ~1.2 KB
- `SkeletonCard.tsx`: ~1.0 KB
- `SkeletonTable.tsx`: ~1.1 KB
- `SkeletonList.tsx`: ~1.0 KB
- `index.ts`: ~0.2 KB

**Total:** ~4.5 KB (minified: ~3 KB)

---

## Browser Support

All modern browsers support the animations:

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Graceful degradation: If animations aren't supported, users see static skeleton shapes (still functional).

