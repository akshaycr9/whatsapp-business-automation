import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateFormState } from '@/hooks/templates/use-template-form-state';
import { useTemplateFormLogic } from '@/hooks/templates/use-template-form-logic';
import type { UseFormReturn } from 'react-hook-form';
import type { TemplateFormData } from '@/lib/template-form.schema';
import type { TemplateButtonType, TemplateButtonGroupType } from '@/types';

export interface UseNewTemplatePageReturn {
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

export function useNewTemplatePage(): UseNewTemplatePageReturn {
  const navigate = useNavigate();

  const handleBack = useCallback((): void => {
    navigate('/templates');
  }, [navigate]);

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
  } = useTemplateFormState();

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

  return {
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
    onSubmit: formLogic.onSubmit,
    handleBack,
  };
}
