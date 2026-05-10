// Re-exports for backward compatibility — new code should import from:
//   src/api/templates.api.ts   (pure async functions)
//   src/store/actions/templates.actions.ts  (async thunks)
export {
  fetchTemplates,
  createTemplate,
  deleteTemplate,
  syncTemplate,
  syncAllTemplates,
  fetchStatusCounts,
  updateTemplate,
} from '@/store/actions/templates.actions';
