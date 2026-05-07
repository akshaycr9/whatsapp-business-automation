import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch, UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateFormSchema, type TemplateFormData } from '@/lib/template-form.schema';
import { TemplateButtonGroupType } from '@/types';

interface UseTemplateFormStateReturn {
  // Form instance
  form: UseFormReturn<TemplateFormData>;

  // Watched values
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

  // Field array operations
  buttonFields: Array<{ id: string }>;
  appendButton: UseFieldArrayReturn<TemplateFormData, 'buttons'>['append'];
  removeButton: (index: number) => void;
}

interface UseTemplateFormStateParams {
  initialValues?: Partial<TemplateFormData>;
}

export function useTemplateFormState(params?: UseTemplateFormStateParams): UseTemplateFormStateReturn {
  // Initialize form
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      language: 'en',
      category: 'MARKETING',
      headerEnabled: false,
      headerText: '',
      bodyText: '',
      bodySamples: [],
      footerEnabled: false,
      footerText: '',
      buttonsEnabled: false,
      buttonGroup: TemplateButtonGroupType.QUICK_REPLY,
      buttons: [],
      ...params?.initialValues,
    },
  });

  const { control } = form;

  // Reset form when initialValues change (for edit mode)
  useEffect(() => {
    if (params?.initialValues) {
      form.reset({
        name: '',
        language: 'en',
        category: 'MARKETING',
        headerEnabled: false,
        headerText: '',
        bodyText: '',
        bodySamples: [],
        footerEnabled: false,
        footerText: '',
        buttonsEnabled: false,
        buttonGroup: TemplateButtonGroupType.QUICK_REPLY,
        buttons: [],
        ...params.initialValues,
      });
    }
  }, [params?.initialValues, form]);

  // Watch all form fields
  const headerEnabled = useWatch({ control, name: 'headerEnabled' });
  const headerText = useWatch({ control, name: 'headerText' });
  const bodyText = useWatch({ control, name: 'bodyText' });
  const bodySamples = useWatch({ control, name: 'bodySamples' });
  const footerEnabled = useWatch({ control, name: 'footerEnabled' });
  const footerText = useWatch({ control, name: 'footerText' });
  const buttonsEnabled = useWatch({ control, name: 'buttonsEnabled' });
  const buttonGroup = useWatch({ control, name: 'buttonGroup' });
  const buttons = useWatch({ control, name: 'buttons' });
  const category = useWatch({ control, name: 'category' });

  // Field array for buttons
  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control,
    name: 'buttons',
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
    buttonGroup: buttonGroup as TemplateButtonGroupType,
    buttons,
    category,
    buttonFields,
    appendButton,
    removeButton,
  };
}
