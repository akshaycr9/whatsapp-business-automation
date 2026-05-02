import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTemplates,
  type StatusFilter,
  type StatusCounts,
} from "@/hooks/templates/use-templates";
import { toast } from "@/hooks/use-toast";
import { TemplateStatus } from "@/types/templates";
import type { Template } from "@/types";

interface UseTemplatesPageReturn {
  setPreviewId: (id: string | null) => void;
  syncingAll: boolean;
  syncingIds: Set<string>;
  catFilter: string;
  setCatFilter: (cat: string) => void;
  filtered: Template[];
  previewTemplate: Template | null;
  handleSyncAll: () => Promise<void>;
  handleSync: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  openEditor: (id: string) => void;
  navigateToNew: () => void;
}

export function useTemplatesPage(
  templates: Template[],
  statusCounts: StatusCounts,
): UseTemplatesPageReturn {
  const navigate = useNavigate();
  const { removeTemplate, syncOne, syncAll } = useTemplates();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<string>("all");

  const tabCounts = useMemo(
    () => ({
      all: statusCounts.all,
      [TemplateStatus.APPROVED]: statusCounts[TemplateStatus.APPROVED],
      [TemplateStatus.PENDING]: statusCounts[TemplateStatus.PENDING],
      [TemplateStatus.REJECTED]: statusCounts[TemplateStatus.REJECTED],
    }),
    [statusCounts],
  );

  const filtered = useMemo(
    () =>
      catFilter === "all"
        ? templates
        : templates.filter((t) => t.category === catFilter),
    [templates, catFilter],
  );

  const previewTemplate = useMemo(
    () =>
      previewId ? (templates.find((t) => t.id === previewId) ?? null) : null,
    [previewId, templates],
  );

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    try {
      const result = await syncAll();
      toast({
        title: `Synced ${result.synced} template${result.synced !== 1 ? "s" : ""}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSyncingAll(false);
    }
  }, [syncAll]);

  const handleSync = useCallback(
    async (id: string) => {
      setSyncingIds((prev) => new Set(prev).add(id));
      try {
        const updated = await syncOne(id);
        toast({
          title: "Template synced",
          description:
            updated.status === TemplateStatus.REJECTED && updated.rejectedReason
              ? `Rejected: ${updated.rejectedReason}`
              : `Status: ${updated.status}`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [syncOne],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeTemplate(id);
        toast({ title: "Template deleted" });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Failed to delete template",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [removeTemplate],
  );

  const openEditor = useCallback(
    (id: string) => {
      setPreviewId(null);
      navigate(`/templates/${id}/edit`);
    },
    [navigate],
  );

  const navigateToNew = useCallback(() => {
    navigate("/templates/new");
  }, [navigate]);

  return {
    setPreviewId,
    syncingAll,
    syncingIds,
    catFilter,
    setCatFilter,
    filtered,
    previewTemplate,
    handleSyncAll,
    handleSync,
    handleDelete,
    openEditor,
    navigateToNew,
  };
}
