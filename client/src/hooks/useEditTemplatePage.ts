import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateFormState } from '@/hooks/templates/use-template-form-state';
import { useTemplateFormLogic } from '@/hooks/templates/use-template-form-logic';
import { useEditTemplateForm } from '@/hooks/templates/use-edit-template-form';
import { useTemplates } from '@/hooks/templates/use-templates';
import { toast } from '@/hooks/use-toast';
import { buildTemplateComponents } from '@/utils/templates.utils';
import type { UseFormReturn } from 'react-hook-form';
import type { TemplateFormData } from '@/lib/template-form.schema';
import type { Template, TemplateButtonType, TemplateButtonGroupType } from '@/types';

export interface UseEditTemplatePageReturn {
  template: Template | null;
  form: UseFormReturn<TemplateFormData>;
  headerEnabled: boolean;
  headerText: string;
  bodyText: string;
  bodySamples: string[];
  footerEnabled: boolean;
  footerText: string;
  buttonsEnabled: boolean;
  buttonGroup: TemplateButtonGroupType;
  buttons: TemplateFormData['buttons'];
  category: TemplateFormData['category'];
  removeButton: (index: number) => void;
  detectedVars: string[];
  quickReplies: TemplateFormData['buttons'];
  urlBtn: TemplateFormData['buttons'][0] | undefined;
  phoneBtn: TemplateFormData['buttons'][0] | undefined;
  copyBtn: TemplateFormData['buttons'][0] | undefined;
  urlBtnIndex: number;
  phoneBtnIndex: number;
  copyBtnIndex: number;
  isDynamicUrl: boolean;
  previewHeader: string | undefined;
  previewBody: string;
  previewFooter: string | undefined;
  previewButtons: Array<{ type: TemplateButtonType; text: string }>;
  insertVariable: () => void;
  addButtonOfType: (type: TemplateButtonType) => void;
  handleButtonGroupChange: (group: TemplateButtonGroupType) => void;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  handleBack: () => void;
}

export function useEditTemplatePage(
  templateId: string | undefined,
): UseEditTemplatePageReturn {
  const navigate = useNavigate();
  const { updateTemplate } = useTemplates();

  const handleBack = useCallback((): void => {
    navigate('/templates');
  }, [navigate]);

  const { template, initialValues } = useEditTemplateForm(templateId);

  const {
    form,
    headerEnabled,
    headerText,
    bodyText,
    bodySamples,
    footerEnabled,
    footerText,
    buttonsEnabled,
    buttonGroup,
    buttons,
    category,
    removeButton,
  } = useTemplateFormState({ initialValues });

  const formLogic = useTemplateFormLogic({
    form,
    headerEnabled,
    headerText,
    bodyText,
    bodySamples,
    footerEnabled,
    footerText,
    buttonsEnabled,
    buttonGroup,
    buttons,
    category,
  });

  const onSubmit = useCallback(
    async (data: TemplateFormData): Promise<void> => {
      if (!template) return;
      const components = buildTemplateComponents(data);
      try {
        await updateTemplate(template.id, components);
        toast({ title: 'Template saved' });
        navigate('/templates');
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to save template',
          variant: 'destructive',
        });
      }
    },
    [template, updateTemplate, navigate],
  );

  return {
    template,
    form,
    headerEnabled,
    headerText,
    bodyText,
    bodySamples,
    footerEnabled,
    footerText,
    buttonsEnabled,
    buttonGroup,
    buttons,
    category,
    removeButton,
    detectedVars: formLogic.detectedVars,
    quickReplies: formLogic.quickReplies,
    urlBtn: formLogic.urlBtn,
    phoneBtn: formLogic.phoneBtn,
    copyBtn: formLogic.copyBtn,
    urlBtnIndex: formLogic.urlBtnIndex,
    phoneBtnIndex: formLogic.phoneBtnIndex,
    copyBtnIndex: formLogic.copyBtnIndex,
    isDynamicUrl: formLogic.isDynamicUrl,
    previewHeader: formLogic.previewHeader,
    previewBody: formLogic.previewBody,
    previewFooter: footerEnabled ? footerText : undefined,
    previewButtons: formLogic.previewButtons,
    insertVariable: formLogic.insertVariable,
    addButtonOfType: formLogic.addButtonOfType,
    handleButtonGroupChange: formLogic.handleButtonGroupChange,
    onSubmit,
    handleBack,
  };
}
