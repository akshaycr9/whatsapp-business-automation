import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  syncTemplate,
  syncAllTemplates,
  fetchStatusCounts,
} from '../templates';
import { createTestStore } from '@/test/test-utils';
import { templateFactory } from '@/test/factories/template.factory';
import { resetMockTemplates } from '@/test/mocks/handlers';
import { TemplateStatus, TemplateCategory, TemplateComponentType } from '@/types/templates';
import { api } from '@/lib/api';
import type { CreateTemplateInput } from '@/types';

describe('Template API Thunks', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    resetMockTemplates(); // Reset mock data before each test
  });

  describe('fetchTemplates', () => {
    it('fetches templates successfully', async () => {
      const result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: 'all' })
      );

      expect(fetchTemplates.fulfilled.match(result)).toBe(true);
      if (fetchTemplates.fulfilled.match(result)) {
        expect(result.payload.templates).toBeDefined();
        expect(Array.isArray(result.payload.templates)).toBe(true);
        expect(result.payload.meta).toBeDefined();
        expect(result.payload.meta.page).toBe(1);
        expect(result.payload.meta.limit).toBe(20);
      }
    });

    it('returns templates with pagination metadata', async () => {
      const result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: 'all' })
      );

      expect(fetchTemplates.fulfilled.match(result)).toBe(true);
      if (fetchTemplates.fulfilled.match(result)) {
        const { templates, meta } = result.payload;
        expect(meta.total).toBeGreaterThanOrEqual(0);
        expect(meta.page).toBe(1);
        expect(meta.limit).toBe(20);
        expect(meta.totalPages).toBeGreaterThanOrEqual(0);
      }
    });

    it('filters templates by search term', async () => {
      const result = await store.dispatch(
        fetchTemplates({ search: 'Template 1', page: 1, statusFilter: 'all' })
      );

      expect(fetchTemplates.fulfilled.match(result)).toBe(true);
      if (fetchTemplates.fulfilled.match(result)) {
        const { templates } = result.payload;
        // All returned templates should match the search term
        templates.forEach(t => {
          expect(t.name.toLowerCase()).toContain('template 1'.toLowerCase());
        });
      }
    });

    it('filters templates by status', async () => {
      const result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: TemplateStatus.PENDING })
      );

      expect(fetchTemplates.fulfilled.match(result)).toBe(true);
      if (fetchTemplates.fulfilled.match(result)) {
        const { templates } = result.payload;
        // All returned templates should have PENDING status
        templates.forEach(t => {
          expect(t.status).toBe(TemplateStatus.PENDING);
        });
      }
    });

    it('applies pagination correctly', async () => {
      // Fetch first page
      const page1Result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: 'all' })
      );

      // Fetch second page
      const page2Result = await store.dispatch(
        fetchTemplates({ search: '', page: 2, statusFilter: 'all' })
      );

      expect(fetchTemplates.fulfilled.match(page1Result)).toBe(true);
      expect(fetchTemplates.fulfilled.match(page2Result)).toBe(true);

      if (
        fetchTemplates.fulfilled.match(page1Result) &&
        fetchTemplates.fulfilled.match(page2Result)
      ) {
        expect(page1Result.payload.meta.page).toBe(1);
        expect(page2Result.payload.meta.page).toBe(2);
      }
    });
  });

  describe('createTemplate', () => {
    it('creates a template successfully', async () => {
      const input: CreateTemplateInput = {
        name: 'New Test Template',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [
          {
            type: TemplateComponentType.BODY,
            text: 'Test body {{1}}',
          },
        ],
      };

      const result = await store.dispatch(createTemplate(input));

      expect(createTemplate.fulfilled.match(result)).toBe(true);
      if (createTemplate.fulfilled.match(result)) {
        const template = result.payload;
        expect(template.id).toBeDefined();
        expect(template.name).toBe('New Test Template');
        expect(template.language).toBe('en');
        expect(template.category).toBe(TemplateCategory.UTILITY);
        expect(template.status).toBe(TemplateStatus.PENDING);
      }
    });

    it('creates template with status PENDING', async () => {
      const input: CreateTemplateInput = {
        name: 'Order Confirmed',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [
          {
            type: TemplateComponentType.BODY,
            text: 'Order {{1}} confirmed',
          },
        ],
      };

      const result = await store.dispatch(createTemplate(input));

      expect(createTemplate.fulfilled.match(result)).toBe(true);
      if (createTemplate.fulfilled.match(result)) {
        expect(result.payload.status).toBe(TemplateStatus.PENDING);
      }
    });

    it('creates template with required fields', async () => {
      const input: CreateTemplateInput = {
        name: 'Minimal Template',
        language: 'en',
        category: TemplateCategory.MARKETING,
        components: [],
      };

      const result = await store.dispatch(createTemplate(input));

      expect(createTemplate.fulfilled.match(result)).toBe(true);
      if (createTemplate.fulfilled.match(result)) {
        const template = result.payload;
        expect(template.id).toBeDefined();
        expect(template.name).toBe('Minimal Template');
        expect(template.components).toBeDefined();
      }
    });
  });

  describe('updateTemplate', () => {
    it('updates a template successfully', async () => {
      // Create a template first
      const createInput: CreateTemplateInput = {
        name: 'Original Name',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [
          {
            type: TemplateComponentType.BODY,
            text: 'Original body',
          },
        ],
      };

      const createResult = await store.dispatch(createTemplate(createInput));
      expect(createTemplate.fulfilled.match(createResult)).toBe(true);

      if (createTemplate.fulfilled.match(createResult)) {
        const templateId = createResult.payload.id;

        // Update the template
        const updateResult = await store.dispatch(
          updateTemplate({
            id: templateId,
            components: [
              {
                type: TemplateComponentType.BODY,
                text: 'Updated body {{1}}',
              },
            ],
          })
        );

        expect(updateTemplate.fulfilled.match(updateResult)).toBe(true);
        if (updateTemplate.fulfilled.match(updateResult)) {
          expect(updateResult.payload.id).toBe(templateId);
        }
      }
    });

    it('rejects update for non-existent template', async () => {
      const result = await store.dispatch(
        updateTemplate({
          id: 'non-existent-id',
          components: [
            {
              type: TemplateComponentType.BODY,
              text: 'Updated body',
            },
          ],
        })
      );

      expect(updateTemplate.rejected.match(result)).toBe(true);
      if (updateTemplate.rejected.match(result)) {
        expect(result.payload).toBeDefined();
      }
    });
  });

  describe('deleteTemplate', () => {
    it('deletes a template successfully', async () => {
      // Create a template first
      const createInput: CreateTemplateInput = {
        name: 'Template to Delete',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [],
      };

      const createResult = await store.dispatch(createTemplate(createInput));
      expect(createTemplate.fulfilled.match(createResult)).toBe(true);

      if (createTemplate.fulfilled.match(createResult)) {
        const templateId = createResult.payload.id;

        // Delete the template
        const deleteResult = await store.dispatch(deleteTemplate(templateId));

        expect(deleteTemplate.fulfilled.match(deleteResult)).toBe(true);
        if (deleteTemplate.fulfilled.match(deleteResult)) {
          expect(deleteResult.payload).toBe(templateId);
        }
      }
    });

    it('rejects delete for non-existent template', async () => {
      const result = await store.dispatch(deleteTemplate('non-existent-id'));

      expect(deleteTemplate.rejected.match(result)).toBe(true);
      if (deleteTemplate.rejected.match(result)) {
        expect(result.payload).toBeDefined();
      }
    });
  });

  describe('syncTemplate', () => {
    it('syncs a template successfully', async () => {
      // Create a template first
      const createInput: CreateTemplateInput = {
        name: 'Template to Sync',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [
          {
            type: TemplateComponentType.BODY,
            text: 'Test body',
          },
        ],
      };

      const createResult = await store.dispatch(createTemplate(createInput));
      expect(createTemplate.fulfilled.match(createResult)).toBe(true);

      if (createTemplate.fulfilled.match(createResult)) {
        const templateId = createResult.payload.id;
        const initialStatus = createResult.payload.status;

        // Sync the template
        const syncResult = await store.dispatch(syncTemplate(templateId));

        expect(syncTemplate.fulfilled.match(syncResult)).toBe(true);
        if (syncTemplate.fulfilled.match(syncResult)) {
          const syncedTemplate = syncResult.payload;
          expect(syncedTemplate.id).toBe(templateId);
          expect(syncedTemplate.status).toBe(TemplateStatus.APPROVED);
        }
      }
    });

    it('rejects sync for non-existent template', async () => {
      const result = await store.dispatch(syncTemplate('non-existent-id'));

      expect(syncTemplate.rejected.match(result)).toBe(true);
      if (syncTemplate.rejected.match(result)) {
        expect(result.payload).toBeDefined();
      }
    });

    it('updates template status to APPROVED after sync', async () => {
      const createInput: CreateTemplateInput = {
        name: 'Pending Template',
        language: 'en',
        category: TemplateCategory.AUTHENTICATION,
        components: [],
      };

      const createResult = await store.dispatch(createTemplate(createInput));

      if (createTemplate.fulfilled.match(createResult)) {
        const templateId = createResult.payload.id;
        const syncResult = await store.dispatch(syncTemplate(templateId));

        expect(syncTemplate.fulfilled.match(syncResult)).toBe(true);
        if (syncTemplate.fulfilled.match(syncResult)) {
          expect(syncResult.payload.status).toBe(TemplateStatus.APPROVED);
        }
      }
    });
  });

  describe('syncAllTemplates', () => {
    it('syncs all templates successfully', async () => {
      const result = await store.dispatch(syncAllTemplates());

      expect(syncAllTemplates.fulfilled.match(result)).toBe(true);
      if (syncAllTemplates.fulfilled.match(result)) {
        expect(typeof result.payload).toBe('object');
        expect(result.payload).toBeDefined();
      }
    });

    it('returns object with sync count', async () => {
      const result = await store.dispatch(syncAllTemplates());

      expect(syncAllTemplates.fulfilled.match(result)).toBe(true);
      if (syncAllTemplates.fulfilled.match(result)) {
        // MSW handler returns syncedCount or synced depending on implementation
        const hasCount = 'synced' in result.payload || 'syncedCount' in result.payload;
        expect(hasCount).toBe(true);
      }
    });
  });

  describe('fetchStatusCounts', () => {
    it('fetches status counts successfully', async () => {
      const result = await store.dispatch(fetchStatusCounts());

      expect(fetchStatusCounts.fulfilled.match(result)).toBe(true);
      if (fetchStatusCounts.fulfilled.match(result)) {
        const counts = result.payload;
        expect(counts).toHaveProperty(TemplateStatus.PENDING);
        expect(counts).toHaveProperty(TemplateStatus.APPROVED);
        expect(counts).toHaveProperty(TemplateStatus.REJECTED);
      }
    });

    it('returns non-negative counts', async () => {
      const result = await store.dispatch(fetchStatusCounts());

      expect(fetchStatusCounts.fulfilled.match(result)).toBe(true);
      if (fetchStatusCounts.fulfilled.match(result)) {
        const counts = result.payload;
        Object.values(counts).forEach(count => {
          expect(count).toBeGreaterThanOrEqual(0);
          expect(typeof count).toBe('number');
        });
      }
    });

    it('returns all three status types', async () => {
      const result = await store.dispatch(fetchStatusCounts());

      expect(fetchStatusCounts.fulfilled.match(result)).toBe(true);
      if (fetchStatusCounts.fulfilled.match(result)) {
        const counts = result.payload;
        expect(Object.keys(counts).length).toBe(3);
        expect(counts[TemplateStatus.PENDING]).toBeDefined();
        expect(counts[TemplateStatus.APPROVED]).toBeDefined();
        expect(counts[TemplateStatus.REJECTED]).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('returns error message on failure', async () => {
      const result = await store.dispatch(deleteTemplate('invalid-id'));

      expect(deleteTemplate.rejected.match(result)).toBe(true);
      if (deleteTemplate.rejected.match(result)) {
        expect(typeof result.payload).toBe('string');
        expect(result.payload?.length).toBeGreaterThan(0);
      }
    });

    it('rejects with string error message on API failure', async () => {
      const result = await store.dispatch(syncTemplate('non-existent-id'));

      expect(syncTemplate.rejected.match(result)).toBe(true);
      if (syncTemplate.rejected.match(result)) {
        expect(typeof result.payload).toBe('string');
      }
    });

    it('handles not found errors gracefully', async () => {
      const result = await store.dispatch(updateTemplate({
        id: 'non-existent-id',
        components: [],
      }));

      expect(updateTemplate.rejected.match(result)).toBe(true);
      if (updateTemplate.rejected.match(result)) {
        expect(result.payload).toBeDefined();
      }
    });
  });

  describe('Thunk Return Types', () => {
    it('fetchTemplates returns tuple of templates and meta', async () => {
      const result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: 'all' })
      );

      expect(fetchTemplates.fulfilled.match(result)).toBe(true);
      if (fetchTemplates.fulfilled.match(result)) {
        const { templates, meta } = result.payload;
        expect(Array.isArray(templates)).toBe(true);
        expect(meta).toBeDefined();
        expect(meta.total).toBeDefined();
      }
    });

    it('createTemplate returns single template', async () => {
      const input: CreateTemplateInput = {
        name: 'Test',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [],
      };

      const result = await store.dispatch(createTemplate(input));

      expect(createTemplate.fulfilled.match(result)).toBe(true);
      if (createTemplate.fulfilled.match(result)) {
        expect(result.payload.id).toBeDefined();
        expect(result.payload.name).toBeDefined();
      }
    });

    it('deleteTemplate returns template id', async () => {
      const input: CreateTemplateInput = {
        name: 'Test',
        language: 'en',
        category: TemplateCategory.UTILITY,
        components: [],
      };

      const createResult = await store.dispatch(createTemplate(input));

      if (createTemplate.fulfilled.match(createResult)) {
        const templateId = createResult.payload.id;
        const deleteResult = await store.dispatch(deleteTemplate(templateId));

        expect(deleteTemplate.fulfilled.match(deleteResult)).toBe(true);
        if (deleteTemplate.fulfilled.match(deleteResult)) {
          expect(deleteResult.payload).toBe(templateId);
        }
      }
    });
  });

  describe('Error Fallback Messages (Non-Error Exceptions)', () => {
    it('fetchTemplates returns fallback message for non-Error exception', async () => {
      const getspy = vi.spyOn(api, 'get').mockRejectedValueOnce('Network error');

      const result = await store.dispatch(
        fetchTemplates({ search: '', page: 1, statusFilter: 'all' })
      );

      expect(fetchTemplates.rejected.match(result)).toBe(true);
      if (fetchTemplates.rejected.match(result)) {
        expect(result.payload).toBe('Failed to load templates');
      }

      getspy.mockRestore();
    });

    it('createTemplate returns fallback message for non-Error exception', async () => {
      const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce({ code: 'ERR_UNKNOWN' });

      const result = await store.dispatch(
        createTemplate({
          name: 'Test',
          language: 'en',
          category: TemplateCategory.UTILITY,
          components: [],
        })
      );

      expect(createTemplate.rejected.match(result)).toBe(true);
      if (createTemplate.rejected.match(result)) {
        expect(result.payload).toBe('Failed to create template');
      }

      postSpy.mockRestore();
    });

    it('syncAllTemplates returns fallback message for non-Error exception', async () => {
      const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce(null);

      const result = await store.dispatch(syncAllTemplates());

      expect(syncAllTemplates.rejected.match(result)).toBe(true);
      if (syncAllTemplates.rejected.match(result)) {
        expect(result.payload).toBe('Failed to sync all templates');
      }

      postSpy.mockRestore();
    });

    it('fetchStatusCounts returns fallback message for non-Error exception', async () => {
      const getSpy = vi.spyOn(api, 'get').mockRejectedValueOnce(undefined);

      const result = await store.dispatch(fetchStatusCounts());

      expect(fetchStatusCounts.rejected.match(result)).toBe(true);
      if (fetchStatusCounts.rejected.match(result)) {
        expect(result.payload).toBe('Failed to fetch status counts');
      }

      getSpy.mockRestore();
    });
  });
});
