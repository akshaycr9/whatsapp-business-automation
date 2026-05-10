import { useParams } from "react-router-dom";
import { useEditTemplatePage } from "@/hooks/useEditTemplatePage";
import { TemplatePageLayout } from "@/components/templates/TemplatePageLayout";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { TemplateNotFound } from "@/components/templates/TemplateNotFound";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();

  const {
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
    detectedVars,
    quickReplies,
    urlBtn,
    phoneBtn,
    copyBtn,
    urlBtnIndex,
    phoneBtnIndex,
    copyBtnIndex,
    isDynamicUrl,
    previewHeader,
    previewBody,
    previewFooter,
    previewButtons,
    insertVariable,
    addButtonOfType,
    handleButtonGroupChange,
    onSubmit,
    handleBack,
  } = useEditTemplatePage(id);

  if (!template) {
    return <TemplateNotFound />;
  }

  return (
    <TemplatePageLayout
      topbarPageName="Templates"
      topbarSubPageName={template.name}
      onBackClick={handleBack}
      previewHeader={previewHeader}
      previewBody={previewBody}
      previewFooter={previewFooter}
      previewButtons={previewButtons}
      detectedVars={detectedVars}
    >
      <TemplateForm
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
        detectedVars={detectedVars}
        quickReplies={quickReplies}
        urlBtn={urlBtn}
        phoneBtn={phoneBtn}
        copyBtn={copyBtn}
        urlBtnIndex={urlBtnIndex}
        phoneBtnIndex={phoneBtnIndex}
        copyBtnIndex={copyBtnIndex}
        isDynamicUrl={isDynamicUrl}
        insertVariable={insertVariable}
        addButtonOfType={addButtonOfType}
        handleButtonGroupChange={handleButtonGroupChange}
        onSubmit={onSubmit}
      />
    </TemplatePageLayout>
  );
}
