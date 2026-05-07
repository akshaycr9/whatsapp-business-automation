import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function TemplateNotFound() {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate("/templates");
  }, [navigate]);

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <p className="text-sm text-ink-500">Template not found.</p>
      <button
        className="mt-4 text-sm font-semibold text-brand-700"
        onClick={handleBack}
      >
        Back to Templates
      </button>
    </div>
  );
}
