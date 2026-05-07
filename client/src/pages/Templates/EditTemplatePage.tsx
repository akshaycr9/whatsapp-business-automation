import { useNavigate, useParams } from "react-router-dom";
import { TemplatePageLayout } from "@/components/templates/TemplatePageLayout";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateNotFound } from "@/components/templates/TemplateNotFound";
import { useTemplateFormState } from "@/hooks/templates/use-template-form-state";
import { useTemplateFormLogic } from "@/hooks/templates/use-template-form-logic";
import { useEditTemplateForm } from "@/hooks/templates/use-edit-template-form";

export default function EditTemplatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Call all hooks unconditionally (must be called every render)
  const { template, initialValues } = useEditTemplateForm(id);

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

  // Conditional render after all hooks are called
  if (!template) {
    return <TemplateNotFound />;
  }

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
      <TemplateForm
        mode="edit"
        templateId={id}
        form={form}
        headerEnabled={headerEnabled}
        headerText={headerText}
        bodyText={bodyText}
        bodySamples={bodySamples}
        footerEnabled={footerEnabled}
        footerText={footerText}
        buttonsEnabled={buttonsEnabled}
        buttonGroup={buttonGroup}
        buttons={buttons}
        category={category}
        removeButton={removeButton}
      />
    </TemplatePageLayout>
  );
}
