import { useState, useEffect } from 'react';
import {
  Send,
  CheckCheck,
  Eye,
  MessageSquare,
  Zap,
  AlertCircle,
  Users,
  FileCheck,
  RefreshCw,
  FilePlus,
  FileEdit,
  FileX,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/use-dashboard';
import type { ActivityItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function useLastUpdated(): string {
  const [, setTick] = useState(0);
  const [lastUpdatedAt] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return formatRelativeTime(new Date(lastUpdatedAt).toISOString());
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  if (type === 'template_created') {
    return (
      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
        <FilePlus className="h-3.5 w-3.5 text-blue-500" />
      </div>
    );
  }
  if (type === 'template_updated') {
    return (
      <div className="h-8 w-8 rounded-full bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center flex-shrink-0">
        <FileEdit className="h-3.5 w-3.5 text-sky-500" />
      </div>
    );
  }
  if (type === 'template_approved') {
    return (
      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
        <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
      </div>
    );
  }
  if (type === 'template_rejected') {
    return (
      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
        <FileX className="h-3.5 w-3.5 text-red-500" />
      </div>
    );
  }
  if (type === 'template_deleted') {
    return (
      <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center flex-shrink-0">
        <Trash2 className="h-3.5 w-3.5 text-orange-500" />
      </div>
    );
  }
  if (type === 'automation_created') {
    return (
      <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
        <Zap className="h-3.5 w-3.5 text-violet-500" />
      </div>
    );
  }
  if (type === 'automation_updated') {
    return (
      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center flex-shrink-0">
        <Settings className="h-3.5 w-3.5 text-purple-500" />
      </div>
    );
  }
  if (type === 'automation_enabled') {
    return (
      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
        <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
      </div>
    );
  }
  if (type === 'automation_disabled') {
    return (
      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
        <ToggleLeft className="h-3.5 w-3.5 text-amber-500" />
      </div>
    );
  }
  // automation_deleted
  return (
    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
      <Trash2 className="h-3.5 w-3.5 text-red-500" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-12 flex-shrink-0" />
    </div>
  );
}

export default function DashboardPage() {
  const { stats, activity, loading, error, refetch } = useDashboard();
  const lastUpdated = useLastUpdated();

  const handleRefresh = async () => {
    await refetch();
  };

  if (error && !stats) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()} className="ml-4">
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your WhatsApp automation activity
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant="secondary" className="text-xs font-normal">
            Updated {lastUpdated}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid — Row 1: Messages */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Messages (last 30 days)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Messages Sent */}
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-950/40 flex-shrink-0">
                      <Send className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Messages Sent</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.messagesSent ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex-shrink-0">
                      <CheckCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <p className="text-3xl font-bold text-foreground">
                          {stats?.messagesDelivered ?? 0}
                        </p>
                        {(stats?.deliveryRate ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {stats?.deliveryRate ?? 0}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">of messages sent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-violet-100 dark:bg-violet-950/40 flex-shrink-0">
                      <Eye className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Read</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.messagesRead ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950/40 flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Conversations</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.activeConversations ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid — Row 2: Operations */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Operations
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-violet-100 dark:bg-violet-950/40 flex-shrink-0">
                      <Zap className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Automations Run</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.automationsRun ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/40 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Automation Failures</p>
                      <p
                        className={cn(
                          'text-3xl font-bold mt-0.5',
                          (stats?.automationsFailed ?? 0) > 0
                            ? 'text-destructive'
                            : 'text-foreground',
                        )}
                      >
                        {stats?.automationsFailed ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-950/40 flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.totalCustomers ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex-shrink-0">
                      <FileCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Approved Templates</p>
                      <p className="text-3xl font-bold text-foreground mt-0.5">
                        {stats?.templatesApproved ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-border px-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ActivityItemSkeleton key={i} />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Activity will appear here once you create or update templates and automations.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <ActivityIcon type={item.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
