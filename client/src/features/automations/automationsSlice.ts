// Re-export barrel — all logic has moved to the new store structure.
// This file exists only for backward compatibility with any remaining imports.
export { default } from '@/store/slices/automations.slice';
export * from '@/store/actions/automations.actions';
export * from '@/store/selectors/automations.selectors';
