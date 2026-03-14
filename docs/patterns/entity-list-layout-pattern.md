# Entity List Constructor (OpenSea OS)

This document defines the standard structure for entity listing pages. It merges the best patterns from Stock entities:
- Templates page: correct layout, action bar, permission-aware buttons.
- Products page: richer filters, grid and context menu behaviors.

Use this as the blueprint for building or refactoring entity listing pages.

## Goals

- Consistent page structure across entities.
- Clear separation of header and body areas.
- Permission-aware action buttons.
- Reusable CRUD + page logic with predictable behavior.
- Standardized order of elements and modals.

## Mandatory Top-Level Layout

All entity listing pages must follow this order:

1) PageLayout
2) PageHeader
3) PageActionBar
4) Header
5) PageBody
6) SearchBar
7) Filters (optional)
8) EntityGrid / List or Custom View
9) SelectionToolbar
10) Modals (view, create, edit, delete, duplicate, extra)

## Page Header Structure

### PageLayout
- Wrapper for the entire page.
- Configure background, width, and spacing here.

### PageHeader
- Reserved for the top area only.
- Contains the action bar and the main header.

### PageActionBar
- Left: breadcrumb items or optional back button.
- Right: action buttons.
- All action buttons belong here (not in Header).
- Buttons must be filtered by permission before rendering.

### Header
- Title and description for the entity.
- Do not place primary action buttons here. Keep them in PageActionBar.

## Page Body Structure

### SearchBar
- Must bind to page search state.
- Uses the same handler for search and clear.

### Filters (Optional but recommended)
- Prefer URL-driven filters for complex entities.
- Use FilterDropdown for multi-select filtering.
- Filter options should be derived from available data.
- Provide a footer action to open the source list page.

### EntityGrid / List
- Use EntityGrid with both grid and list renderers.
- Must pass the entity config.
- Always supply handlers for click and double click when available.
- Sorting behavior should be provided (default + custom when required).
- Footer buttons can be single or split (dual buttons) depending on entity needs.

### SelectionToolbar
- Shown only when selection exists.
- Includes standard actions: view, edit, duplicate, delete.
- Actions should respect permissions.

### Modals
- Standard modals:
  - View
  - Create
  - Edit
  - Delete confirmation
  - Duplicate confirmation
- Optional custom modals for entity-specific actions.

## Data and State Setup

### CRUD Setup
- Use useEntityCrud for API operations.
- Provide entity name, query key, base URL, and CRUD functions.

### Page Setup
- Use useEntityPage for:
  - Filtering
  - Selection state
  - Default handlers (view, edit, duplicate, delete)
  - Modal state
- Provide a filterFn that supports search and entity-specific fields.

## Permission Checks

### Standard Pattern
- Use usePermissions to access hasPermission.
- Action buttons should include an optional permission field.
- Filter buttons before rendering:
  - Keep only buttons allowed by hasPermission.
  - Strip the permission field before passing to UI components.
- All action buttons in PageActionBar must be permission-checked.

### Recommended Helper (Reusable)

Signature:
- filterButtonsByPermission(buttons, hasPermission)

Behavior:
- Accepts a list of buttons with optional permission.
- Returns buttons without the permission field.
- Filters out buttons for which the user lacks access.

## Filters Pattern (Products Reference)

- Parse URL params for active filters.
- Filter items on top of text search results.
- Compute available filter options based on active filters.
- Update URL when filters change.

## EntityGrid and Context Menu Pattern

- Use EntityContextMenu to wrap EntityCard.
- Provide standard actions: view, edit, duplicate, delete.
- Add extra actions when needed (rename, assign category, etc).
- Use hidden or disabled states for action rules (for example, single selection only).
- Support split footer actions (left/right) for HR patterns (for example, departments and employees counts).

## Standard Render Order (Body)

1) SearchBar
2) Filter row (if present)
3) Grid/List or alternate view
4) SelectionToolbar
5) Modals

## Spacing and Placement Rules

- Use PageLayout to enforce consistent spacing; do not custom-space outside it.
- PageHeader always contains PageActionBar + Header in that order.
- Do not place primary buttons inside Header. The standard is PageActionBar only.
- Avoid ad-hoc wrappers around action buttons. Use PageActionBar consistently.
- Keep spacing inside PageBody consistent: SearchBar, filters, grid, toolbar, modals in a fixed order.

## Dos and Don’ts

### Dos
- Do place all primary action buttons inside PageActionBar.
- Do filter every action button by permission before rendering.
- Do keep SearchBar and filters inside PageBody, above the grid.
- Do use EntityContextMenu to standardize row-level actions.
- Do support split footer buttons when the entity needs dual navigation actions.

### Don’ts
- Don’t put primary action buttons inside Header.
- Don’t skip permission checks for action buttons.
- Don’t invent new spacing patterns outside PageLayout and PageBody.
- Don’t mix filter UI inside the header region.
- Don’t duplicate actions in both action bar and context menu without a clear reason.

## Example Skeleton (Pseudocode)

PageLayout
  PageHeader
    PageActionBar
      breadcrumbItems
      buttons (permission filtered)
    Header
      title
      description
  PageBody
    SearchBar
    Filters
    EntityGrid
    SelectionToolbar
    Modals

## Notes for Implementation

- Use the Templates page as the reference for layout and action bar.
- Use the Products page as the reference for filters, grid richness, and custom actions.
- Keep linearly ordered sections to prevent layout drift.
- Keep action buttons permission-aware to avoid inconsistent UI.
