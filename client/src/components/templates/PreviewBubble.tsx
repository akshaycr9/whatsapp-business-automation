import React from 'react';
import { ExternalLink, Phone, Copy } from 'lucide-react';

interface PreviewButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
}

interface PreviewBubbleProps {
  header?: string;
  body: string;
  footer?: string;
  buttons?: PreviewButton[];
}

export const PreviewBubble = React.memo(function PreviewBubble({ header, body, footer, buttons }: PreviewBubbleProps) {
  if (!body && !header) return null;

  const quickReplies = buttons?.filter((b) => b.type === 'QUICK_REPLY') ?? [];
  const ctaButtons = buttons?.filter((b) => b.type !== 'QUICK_REPLY') ?? [];

  return (
    <div className="mt-4 p-3 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
      <div className="max-w-xs">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 shadow-sm">
          {header && <p className="text-xs font-semibold text-foreground mb-1">{header}</p>}
          {body && <p className="text-sm text-foreground whitespace-pre-wrap">{body}</p>}
          {footer && <p className="text-xs text-muted-foreground mt-1">{footer}</p>}
        </div>

        {/* CTA buttons */}
        {ctaButtons.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {ctaButtons.map((btn, i) => (
              <div
                key={i}
                className="bg-white dark:bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-primary"
              >
                {btn.type === 'URL' && <ExternalLink className="h-3.5 w-3.5" />}
                {btn.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                {btn.type === 'COPY_CODE' && <Copy className="h-3.5 w-3.5" />}
                {btn.text || 'Button'}
              </div>
            ))}
          </div>
        )}

        {/* Quick replies */}
        {quickReplies.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {quickReplies.map((btn, i) => (
              <div
                key={i}
                className="bg-white dark:bg-card border border-border rounded-full px-3 py-1 text-xs font-medium text-primary"
              >
                {btn.text || 'Quick Reply'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
