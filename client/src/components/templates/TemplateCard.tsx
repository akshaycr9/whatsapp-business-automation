import React, { useState } from 'react';
import { MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { getBodyText, extractVariables, getButtonCount } from '@/lib/template-utils';
import type { TemplateStatus } from '@/types';

interface TemplateCardProps {
  id: string;
  name: string;
  category: string;
  language: string;
  status: TemplateStatus;
  components: unknown;
  rejectedReason?: string | null;
  createdAt: string;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const TemplateCard = React.memo(function TemplateCard({
  id,
  name,
  category,
  language,
  status,
  components,
  rejectedReason,
  createdAt,
  onSync,
  onDelete,
}: TemplateCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bodyText = getBodyText(components);
  const variables = extractVariables(bodyText);
  const buttonCount = getButtonCount(components);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
      {/* Card header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{language}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={status} />
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
      </div>

      {/* Body preview */}
      <div className="px-4 flex-1">
        {bodyText ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{bodyText}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No body text</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {variables.map((v) => (
            <span
              key={v}
              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
            >
              {v}
            </span>
          ))}
          {buttonCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary font-medium">
              <MessageSquare className="h-3 w-3" />
              {buttonCount} button{buttonCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {status === 'REJECTED' && rejectedReason && (
          <p className="mt-2 text-xs text-destructive">{rejectedReason}</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 pt-3 flex items-center justify-between mt-auto">
        <p className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-1">
          {!confirmDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleSync()}
                disabled={syncing}
                title="Sync status from Meta"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                title="Delete template"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Also deletes from Meta.</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
