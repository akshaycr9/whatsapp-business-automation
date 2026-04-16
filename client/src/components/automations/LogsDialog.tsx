import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton as SkeletonComp } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/automation-utils';
import type { AutomationLog } from '@/types';

interface LogsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId: string | null;
  automationName: string;
  fetchLogs: (
    id: string,
    page?: number,
  ) => Promise<{
    items: AutomationLog[];
    meta: LogsMeta;
  }>;
}

function logStatusBadge(status: AutomationLog['status']) {
  if (status === 'SENT') {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">
        Sent
      </Badge>
    );
  }
  if (status === 'FAILED') {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}

export function LogsDialog({
  open,
  onOpenChange,
  automationId,
  automationName,
  fetchLogs,
}: LogsDialogProps) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [logsMeta, setLogsMeta] = useState<LogsMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageNum: number) => {
      if (!automationId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLogs(automationId, pageNum);
        setLogs(result.items);
        setLogsMeta(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    },
    [automationId, fetchLogs],
  );

  useEffect(() => {
    if (open && automationId) {
      void load(1);
    }
  }, [open, automationId, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Automation Logs</DialogTitle>
          <DialogDescription>
            {automationName} — {logsMeta.total} total entries
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(logsMeta.page)}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-y-auto flex-1">
          {loading && logs.length === 0 ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonComp key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No logs yet for this automation.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WA Message ID</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.customerPhone}</TableCell>
                    <TableCell>{logStatusBadge(log.status)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                      {log.waMessageId ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {log.errorMessage ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {logsMeta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {logsMeta.page} of {logsMeta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={logsMeta.page <= 1 || loading}
                onClick={() => void load(logsMeta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={logsMeta.page >= logsMeta.totalPages || loading}
                onClick={() => void load(logsMeta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
