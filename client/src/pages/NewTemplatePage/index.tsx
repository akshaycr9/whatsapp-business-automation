import { useNewTemplatePage } from "@/hooks/useNewTemplatePage";
import { TemplatePageLayout } from "@/components/templates/TemplatePageLayout";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function NewTemplatePage() {
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
  } = useNewTemplatePage();

  return (
    <TemplatePageLayout
      topbarPageName="Templates"
      topbarSubPageName="New Template"
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
