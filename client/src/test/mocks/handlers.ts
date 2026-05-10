import { http, HttpResponse } from 'msw';
import { Template, TemplateStatus, TemplateCategory } from '@/types/templates';
import { templateFactory } from '../factories/template.factory';
import { automationHandlers } from './automations.handlers';

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

// Helper to generate mock templates
const generateMockTemplates = (count: number, overrides?: Partial<Template>[]): Template[] => {
  const templates: Template[] = [];
  const statuses: TemplateStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  const categories: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    templates.push(
      templateFactory.create({
        id: `temp-${i + 1}`,
        name: `Template ${i + 1}`,
        status,
        category: categories[i % categories.length],
        ...overrides?.[i],
      })
    );
  }
  return templates;
};

let mockTemplates = generateMockTemplates(3);

export const handlers = [
  ...automationHandlers,
  // GET /api/templates - Fetch templates with filtering
  http.get('/api/templates', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const statusFilter = url.searchParams.get('status') || url.searchParams.get('statusFilter');

    let filtered = [...mockTemplates];

    // Filter by search
    if (search) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Pagination
    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTemplates = filtered.slice(startIndex, endIndex);

    return HttpResponse.json<ApiResponse<Template[]>>(
      {
        data: paginatedTemplates,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 }
    );
  }),

  // POST /api/templates - Create template
  http.post('/api/templates', async ({ request }) => {
    const body = (await request.json()) as any;
    const newTemplate = templateFactory.create({
      ...body,
      id: `temp-${Date.now()}`,
      status: 'PENDING' as TemplateStatus,
    });

    mockTemplates.push(newTemplate);

    return HttpResponse.json<ApiResponse<Template>>(
      { data: newTemplate },
      { status: 201 }
    );
  }),

  // PATCH /api/templates/:id - Update template
  http.patch('/api/templates/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as any;

    const templateIndex = mockTemplates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Template not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const updatedTemplate = {
      ...mockTemplates[templateIndex],
      ...body,
      updatedAt: new Date(),
    };
    mockTemplates[templateIndex] = updatedTemplate;

    return HttpResponse.json<ApiResponse<Template>>(
      { data: updatedTemplate },
      { status: 200 }
    );
  }),

  // DELETE /api/templates/:id - Delete template
  http.delete('/api/templates/:id', ({ params }) => {
    const { id } = params;
    const templateIndex = mockTemplates.findIndex((t) => t.id === id);

    if (templateIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Template not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    mockTemplates.splice(templateIndex, 1);

    return HttpResponse.json(null, { status: 204 });
  }),

  // POST /api/templates/:id/sync - Sync single template
  http.post('/api/templates/:id/sync', async ({ params, request }) => {
    const { id } = params;
    const templateIndex = mockTemplates.findIndex((t) => t.id === id);

    if (templateIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Template not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Simulate syncing - update status to APPROVED
    const syncedTemplate = {
      ...mockTemplates[templateIndex],
      status: 'APPROVED' as TemplateStatus,
      updatedAt: new Date(),
    };
    mockTemplates[templateIndex] = syncedTemplate;

    return HttpResponse.json<ApiResponse<Template>>(
      { data: syncedTemplate },
      { status: 200 }
    );
  }),

  // POST /api/templates/sync-all - Sync all templates
  http.post('/api/templates/sync-all', () => {
    const syncedTemplates = mockTemplates.map((t) => ({
      ...t,
      status: 'APPROVED' as TemplateStatus,
      updatedAt: new Date(),
    }));
    mockTemplates = syncedTemplates;

    return HttpResponse.json<ApiResponse<{ syncedCount: number }>>(
      { data: { syncedCount: syncedTemplates.length } },
      { status: 200 }
    );
  }),

  // GET /api/templates/status-counts - Get status distribution
  http.get('/api/templates/status-counts', () => {
    const counts = {
      PENDING: mockTemplates.filter((t) => t.status === 'PENDING').length,
      APPROVED: mockTemplates.filter((t) => t.status === 'APPROVED').length,
      REJECTED: mockTemplates.filter((t) => t.status === 'REJECTED').length,
    };

    return HttpResponse.json<ApiResponse<typeof counts>>(
      { data: counts },
      { status: 200 }
    );
  }),
];

// Helper to reset mock templates to initial state
export function resetMockTemplates() {
  mockTemplates = generateMockTemplates(3);
}

// Helper to set specific mock templates (for test isolation)
export function setMockTemplates(templates: Template[]) {
  mockTemplates = templates;
}
