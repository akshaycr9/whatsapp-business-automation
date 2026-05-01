import { useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { TemplatePageLayout } from "@/components/templates/TemplatePageLayout";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateNotFound } from "@/components/templates/TemplateNotFound";
import { useTemplates } from "@/hooks/templates/use-templates";
import { useTemplateFormState } from "@/hooks/templates/use-template-form-state";
import { useTemplateFormLogic } from "@/hooks/templates/use-template-form-logic";
import { useEditTemplateForm } from "@/hooks/templates/use-edit-template-form";

export default function EditTemplatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { templates } = useTemplates();

  const template = useMemo(
    () => (id ? templates.find((t) => t.id === id) ?? null : null),
    [id, templates]
  );

  if (!template) {
    return <TemplateNotFound />;
  }

  // Get initial form values for preview only
  const { initialValues } = useEditTemplateForm(id);

  // Initialize form with template data for preview
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
  } = useTemplateFormState({ initialValues });

  // Get preview data
  const { previewHeader, previewBody, previewButtons, detectedVars } =
    useTemplateFormLogic({
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

  return (
    <TemplatePageLayout
      topbarPageName="Templates"
      topbarSubPageName={template.name}
      onBackClick={() => navigate("/templates")}
      previewHeader={previewHeader}
      previewBody={previewBody}
      previewFooter={footerEnabled ? footerText : undefined}
      previewButtons={previewButtons}
      detectedVars={detectedVars}
    >
      <TemplateForm mode="edit" templateId={id} />
    </TemplatePageLayout>
  );
}
