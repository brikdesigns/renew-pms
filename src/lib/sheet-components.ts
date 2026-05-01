import { lazy } from 'react';
import type { SheetType } from './sheet-registry';
import type { ComponentType } from 'react';

/**
 * Runtime map of sheet type → lazy-loaded component.
 *
 * Lazy loading avoids bundling all 9 view sheets on every page.
 * Components are loaded on first open, then cached by React.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sheetComponents: Record<SheetType, React.LazyExoticComponent<ComponentType<any>>> = {
  request:    lazy(() => import('@/components/ViewRequestSheet').then(m => ({ default: m.ViewRequestSheet }))),
  vendor:     lazy(() => import('@/components/ViewVendorSheet').then(m => ({ default: m.ViewVendorSheet }))),
  contact:    lazy(() => import('@/components/ViewContactSheet').then(m => ({ default: m.ViewContactSheet }))),
  task:       lazy(() => import('@/components/ViewTaskSheet').then(m => ({ default: m.ViewTaskSheet }))),
  room:       lazy(() => import('@/components/ViewRoomSheet').then(m => ({ default: m.ViewRoomSheet }))),
  inventory:  lazy(() => import('@/components/ViewInventorySheet').then(m => ({ default: m.ViewInventorySheet }))),
  user:       lazy(() => import('@/components/ViewUserSheet').then(m => ({ default: m.ViewUserSheet }))),
  role:       lazy(() => import('@/components/ViewRoleSheet').then(m => ({ default: m.ViewRoleSheet }))),
  department: lazy(() => import('@/components/ViewDepartmentSheet').then(m => ({ default: m.ViewDepartmentSheet }))),
  template:   lazy(() => import('@/components/ViewTemplateSheet').then(m => ({ default: m.ViewTemplateSheet }))),
};
