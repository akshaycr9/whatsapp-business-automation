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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboard } from '@/hooks/use-dashboard';
import { useLastUpdated } from '@/hooks/use-last-updated';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityItem, ActivityItemSkeleton } from '@/components/dashboard/ActivityItem';
import { formatRelativeTime } from '@/lib/utils';
import type { DashboardStats } from '@/types/dashboard';

// ── Stat card definitions ─────────────────────────────────────────────────────

interface StatDef {
  label: string;
  value: (s: DashboardStats) => number | string;
  subLabel: string;
  icon: React.ReactNode;
}

const MESSAGE_STATS: StatDef[] = [
  {
    label: 'Messages Sent',
    value: (s) => s.messagesSent,
    subLabel: 'Last 30 days',
    icon: <Send className="h-4 w-4 text-blue-500" />,
  },
  {
    label: 'Delivered',
    value: (s) => s.messagesDelivered,
    subLabel: 'of messages sent',
    icon: <CheckCheck className="h-4 w-4 text-emerald-500" />,
  },
  {
    label: 'Read',
    value: (s) => s.messagesRead,
    subLabel: 'Last 30 days',
    icon: <Eye className="h-4 w-4 text-violet-500" />,
  },
  {
    label: 'Active Conversations',
    value: (s) => s.activeConversations,
    subLabel: 'Last 7 days',
    icon: <MessageSquare className="h-4 w-4 text-amber-500" />,
  },
];

const OPERATION_STATS: StatDef[] = [
  {
    label: 'Automations Run',
    value: (s) => s.automationsRun,
    subLabel: 'Last 30 days',
    icon: <Zap className="h-4 w-4 text-violet-500" />,
  },
  {
    label: 'Automation Failures',
    value: (s) => s.automationsFailed,
    subLabel: 'Last 30 days',
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
  },
  {
    label: 'Total Customers',
    value: (s) => s.totalCustomers,
    subLabel: 'All time',
    icon: <Users className="h-4 w-4 text-blue-500" />,
  },
  {
    label: 'Approved Templates',
    value: (s) => s.templatesApproved,
    subLabel: 'Ready to use',
    icon: <FileCheck className="h-4 w-4 text-emerald-500" />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

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
            Updated {formatRelativeTime(lastUpdated)}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Non-blocking error banner */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid — Messages */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Messages (last 30 days)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MESSAGE_STATS.map((def) => (
            <StatCard
              key={def.label}
              label={def.label}
              value={stats ? def.value(stats) : 0}
              icon={def.icon}
              subLabel={def.subLabel}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Stats Grid — Operations */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Operations
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {OPERATION_STATS.map((def) => (
            <StatCard
              key={def.label}
              label={def.label}
              value={stats ? def.value(stats) : 0}
              icon={def.icon}
              subLabel={def.subLabel}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-border px-5">
                <ActivityItemSkeleton count={6} />
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
                  <ActivityItem
                    key={item.id}
                    id={item.id}
                    type={item.type}
                    description={item.description}
                    timestamp={item.timestamp}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
