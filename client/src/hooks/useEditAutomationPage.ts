import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAutomations } from '@/hooks/use-automations';
import { extractBodyText, detectVariables, extractUrlButtonVars } from '@/lib/automation-utils';
import { SHOPIFY_PATH_OPTIONS } from '@/lib/shopify-paths';
import { RAZORPAY_PATH_OPTIONS } from '@/lib/razorpay-paths';
import {
  ABANDONED_CART_DELAY_OPTIONS,
  COD_FOLLOW_UP_DELAY_OPTIONS,
  extractHeaderText,
  extractFooterText,
  extractPhoneButtons,
  buildPreviewBodyNodes,
  type DelayOption,
} from '@/utils/automations.utils';
import type { PhoneButton } from '@/components/templates/PhonePreview';
import type { Template } from '@/types';
import type React from 'react';

export interface UseEditAutomationPageReturn {
  // Loading / redirect state
  loading: boolean;
  automationNotFound: boolean;

  // Derived: raw body text (needed by PhonePreview `body` prop)
  bodyText: string;

  // Automation metadata (safe to read once not null)
  automationName: string;

  // Form state
  selectedTemplateId: string;
  varMapping: Record<string, string>;
  selectedDelay: number;
  saving: boolean;
  error: string | null;

  // Derived: timing
  showTimingSelect: boolean;
  isCODFollowUp: boolean;
  delayOptions: DelayOption[];

  // Derived: template data
  approvedTemplates: Template[];
  selectedTemplate: Template | null;
  bodyVars: string[];
  urlVars: ReturnType<typeof extractUrlButtonVars>;
  isAbandonedCart: boolean;

  // Derived: preview
  previewHeader: string;
  previewFooter: string;
  previewButtons: PhoneButton[];
  previewBodyContent: React.ReactNode;

  // Handlers
  handleTemplateChange: (id: string) => void;
  handlePathChange: (key: string, path: string) => void;
  handleDelayChange: (value: number) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
}

export function useEditAutomationPage(): UseEditAutomationPageReturn {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, approvedTemplates, loading, updateAutomation } = useAutomations();

  // Resolve the automation from Redux state
  const automation = useMemo(
    () => categories.flatMap((c) => c.automations).find((a) => a.id === id) ?? null,
    [categories, id],
  );

  // ── Form state ────────────────────────────────────────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [varMapping, setVarMapping] = useState<Record<string, string>>({});
  const [selectedDelay, setSelectedDelay] = useState<number>(60);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Initialization: populate form from automation once loaded ─────────────────
  useEffect(() => {
    if (automation && !initialized) {
      setSelectedTemplateId(automation.templateId ?? '');
      setVarMapping(automation.variableMapping);
      setSelectedDelay(automation.delayMinutes ?? 60);
      setInitialized(true);
    }
  }, [automation, initialized]);

  // ── Redirect if automation not found after load ───────────────────────────────
  useEffect(() => {
    if (!loading && !automation && !initialized) {
      const t = setTimeout(() => {
        if (!automation) navigate('/automations', { replace: true });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [loading, automation, initialized, navigate]);

  // ── Timing derivations ────────────────────────────────────────────────────────
  const isAbandonedCart = useMemo(
    () =>
      automation?.shopifyEvent
        ? ['ABANDONED_CART_1', 'ABANDONED_CART_2', 'ABANDONED_CART_3'].includes(
            automation.shopifyEvent,
          )
        : false,
    [automation],
  );

  const isCODFollowUp = automation?.shopifyEvent === 'COD_ORDER_FOLLOW_UP';
  const showTimingSelect = isAbandonedCart || isCODFollowUp;
  const delayOptions = isAbandonedCart ? ABANDONED_CART_DELAY_OPTIONS : COD_FOLLOW_UP_DELAY_OPTIONS;

  // ── Template derivations ──────────────────────────────────────────────────────
  const selectedTemplate = useMemo(
    () => approvedTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [approvedTemplates, selectedTemplateId],
  );

  const bodyText = useMemo(
    () => (selectedTemplate ? extractBodyText(selectedTemplate.components) : ''),
    [selectedTemplate],
  );

  const bodyVars = useMemo(
    () => (selectedTemplate ? detectVariables(bodyText) : []),
    [selectedTemplate, bodyText],
  );

  const urlVars = useMemo(
    () => (selectedTemplate ? extractUrlButtonVars(selectedTemplate.components) : []),
    [selectedTemplate],
  );

  // ── Preview derivations ───────────────────────────────────────────────────────
  const previewHeader = useMemo(
    () => (selectedTemplate ? extractHeaderText(selectedTemplate.components) : ''),
    [selectedTemplate],
  );

  const previewFooter = useMemo(
    () => (selectedTemplate ? extractFooterText(selectedTemplate.components) : ''),
    [selectedTemplate],
  );

  const previewButtons = useMemo(
    () => (selectedTemplate ? extractPhoneButtons(selectedTemplate.components) : []),
    [selectedTemplate],
  );

  const pathOptions = useMemo(
    () => (isAbandonedCart ? RAZORPAY_PATH_OPTIONS : SHOPIFY_PATH_OPTIONS),
    [isAbandonedCart],
  );

  const findLabel = useCallback(
    (path: string) => pathOptions.find((o) => o.value === path)?.label ?? path,
    [pathOptions],
  );

  const previewBodyContent = useMemo(
    () => buildPreviewBodyNodes(bodyText, varMapping, findLabel),
    [bodyText, varMapping, findLabel],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleTemplateChange = useCallback((newId: string) => {
    setSelectedTemplateId(newId);
  }, []);

  const handlePathChange = useCallback((key: string, path: string) => {
    setVarMapping((prev) => ({ ...prev, [key]: path }));
  }, []);

  const handleDelayChange = useCallback((value: number) => {
    setSelectedDelay(value);
  }, []);

  const handleSave = useCallback(async () => {
    if (!id || !automation) {
      setError('Automation not found');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updateData: Record<string, unknown> = { variableMapping: varMapping };
      if (selectedTemplateId) updateData.templateId = selectedTemplateId;
      if (showTimingSelect) updateData.delayMinutes = selectedDelay;
      await updateAutomation(id, updateData as Parameters<typeof updateAutomation>[1]);
      navigate('/automations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save automation');
    } finally {
      setSaving(false);
    }
  }, [id, automation, selectedTemplateId, varMapping, showTimingSelect, selectedDelay, updateAutomation, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/automations');
  }, [navigate]);

  return {
    loading,
    automationNotFound: !loading && !automation,
    automationName: automation?.name ?? '',
    bodyText,
    selectedTemplateId,
    varMapping,
    selectedDelay,
    saving,
    error,
    showTimingSelect,
    isCODFollowUp,
    delayOptions,
    approvedTemplates,
    selectedTemplate,
    bodyVars,
    urlVars,
    isAbandonedCart,
    previewHeader,
    previewFooter,
    previewButtons,
    previewBodyContent,
    handleTemplateChange,
    handlePathChange,
    handleDelayChange,
    handleSave,
    handleCancel,
  };
}
