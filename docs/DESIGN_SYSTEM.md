# Design System Documentation

## Color Palette (SaaS Healthcare Standard)

All colors use CSS variables. Edit `src/index.css` to globally change themes.

### Primary Colors
- **Primary**: Teal-600 (`#0D9488`) - Trust, health, primary actions
- **Primary Foreground**: White - Text on primary backgrounds

### Semantic Colors
- **Success**: Emerald-500 (`#10B981`) - Completion, positive
- **Warning**: Amber-500 (`#F59E0B`) - Pending, review needed
- **Danger**: Red-500 (`#EF4444`) - Errors, delete, critical
- **Info**: Cyan-500 (`#0891B2`) - Information, new items

### Neutral Colors
- **Background**: Neutral-50 (`#FAFAFA`) - Page background
- **Card**: White (`#FFFFFF`) - Component backgrounds
- **Foreground**: Slate-900 (`#0F172A`) - Primary text
- **Muted**: Slate-100 (`#F1F5F9`) - Secondary backgrounds
- **Muted Foreground**: Slate-600 (`#475569`) - Secondary text
- **Border**: Slate-200 (`#E2E8F0`) - Dividers, borders

---

## Reusable Components

### Layout
- **Sidebar** - 300px fixed navigation (collapses on mobile)
- **Topbar** - 64px fixed top bar with search, notifications, profile
- **MainLayout** - Main wrapper for all protected pages

### Forms
- **FormSection** - Groups fields with title and description
- **FormField** - Input wrapper with label, error, hint
- **FormGroup** - Multi-column field layout (2, 3, 4 columns)

### Data Display
- **DataTable** - Sortable, filterable, paginated table
- **KPICard** - Metric card with icon, value, trend
- **EmptyState** - Empty state with icon, title, action
- **Skeleton** - Loading placeholder

### Button Types
- Primary (Teal), Secondary, Ghost, Outline, Destructive

---

## Use Cases

### 1. Multi-Section Form
```jsx
<FormSection title="Personal Info">
  <FormGroup columns={2}>
    <FormField label="First Name" required>
      <Input />
    </FormField>
    <FormField label="Last Name" required>
      <Input />
    </FormField>
  </FormGroup>
</FormSection>

<FormSection title="Contact">
  <FormField label="Email" required>
    <Input type="email" />
  </FormField>
</FormSection>
```

### 2. Dashboard Metrics
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <KPICard
    icon={<Users />}
    label="Total Patients"
    value={1234}
    trend={{ value: 12, direction: 'up' }}
  />
</div>
```

### 3. Data Table
```jsx
<DataTable
  data={items}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
  ]}
  keyField="id"
  searchFields={['name']}
/>
```

---

## Responsive Design

- **Mobile** (< 768px): Single column, hamburger menu
- **Tablet** (768-1024px): 2 columns, collapsed sidebar
- **Desktop** (> 1024px): Full layout, expanded sidebar

Use Tailwind prefixes: `md:`, `lg:`, `xl:`

---

## Accessibility

- WCAG AA compliant
- 4.5:1 contrast ratio
- Full keyboard navigation
- Screen reader friendly
- All interactive elements have proper ARIA labels
