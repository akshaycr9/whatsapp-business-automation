import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TemplateErrorAlertProps {
  error: string;
  onRetry: () => void;
}

export function TemplateErrorAlert({ error, onRetry }: TemplateErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <button className="ml-4 text-xs underline underline-offset-2" onClick={onRetry}>
          Try again
        </button>
      </AlertDescription>
    </Alert>
  );
}
