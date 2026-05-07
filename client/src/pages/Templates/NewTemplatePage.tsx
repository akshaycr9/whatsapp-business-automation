import { useNavigate } from "react-router-dom";
import { TemplatePageLayout } from "@/components/templates/TemplatePageLayout";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { useTemplateFormState } from "@/hooks/templates/use-template-form-state";
import { useTemplateFormLogic } from "@/hooks/templates/use-template-form-logic";

export default function NewTemplatePage() {
  const navigate = useNavigate();

  // Get form state and logic for preview data and form
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
      topbarSubPageName="New Template"
      onBackClick={() => navigate("/templates")}
      previewHeader={previewHeader}
      previewBody={previewBody}
      previewFooter={footerEnabled ? footerText : undefined}
      previewButtons={previewButtons}
      detectedVars={detectedVars}
    >
      <TemplateForm
        mode="new"
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
