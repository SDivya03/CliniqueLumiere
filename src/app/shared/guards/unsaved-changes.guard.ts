import { CanDeactivateFn } from '@angular/router';

/** Implemented by routed components that may hold unsaved edits (Story CL-1.2.2). */
export interface CanComponentDeactivate {
  /** Return true to allow navigation, false (or a rejecting promise) to stay. */
  canDeactivate(): boolean | Promise<boolean>;
}

/**
 * Route guard that lets a component veto navigation when it has unsaved changes.
 * The component owns the prompt so the warning can reflect its own dirty state.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) =>
  component.canDeactivate ? component.canDeactivate() : true;
