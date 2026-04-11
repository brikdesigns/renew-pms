/**
 * Global Sheet Registry — type definitions for the sheet navigation system.
 *
 * Each key maps an entity type to the props the sheet component needs
 * to fetch and display that entity. The global `openSheet()` and `pushSheet()`
 * calls are type-checked against this registry.
 */

export interface SheetRegistry {
  request:    { id: string };
  vendor:     { id: string };
  task:       { id: string };
  room:       { id: string };
  inventory:  { id: string };
  user:       { id: string };
  role:       { id: string };
  department: { id: string };
  template:   { id: string };
}

export type SheetType = keyof SheetRegistry;

/**
 * Props injected by AppSheetProvider into every globally-rendered sheet component.
 * View sheets should accept these alongside their entity-specific props.
 *
 * View components use `useConfigureSheet()` from BDS to declare their Sheet
 * title, tabs, and footer — they do NOT render their own `<Sheet>`.
 */
export interface GlobalSheetProps {
  /** Close the entire sheet stack */
  onClose: () => void;
  /** Navigate to a related entity (pushes onto the stack) */
  onNavigate: (type: SheetType, props: Record<string, unknown>, opts?: { title?: string }) => void;
  /** User has admin/manager privileges — injected via globalFrameProps */
  isAdmin?: boolean;
}
