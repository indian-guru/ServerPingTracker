import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Settings, PingLog } from "@shared/schema";

export function SettingsPanel() {
  const { toast } = useToast();
  
  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const { data: recentLogs } = useQuery<PingLog[]>({
    queryKey: ["/api/ping-logs", { limit: 5 }],
    queryFn: () => fetch("/api/ping-logs?limit=5").then(res => res.json()),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<Settings>) => 
      apiRequest("PATCH", "/api/settings", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const formatLogTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };

  const getLogStatusColor = (status: string) => {
    return status === "success" ? "bg-success" : "bg-error";
  };

  const getLogMessage = (log: PingLog, servers: any[]) => {
    const server = servers?.find(s => s.id === log.serverId);
    const serverName = server?.displayName || server?.hostname || `Server ${log.serverId}`;
    
    if (log.status === "success") {
      return `${serverName} responding normally`;
    } else {
      return `${serverName} went offline`;
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Ping Interval
            </Label>
            <Select
              value={settings?.pingInterval?.toString()}
              onValueChange={(value) => 
                updateSettingsMutation.mutate({ pingInterval: parseInt(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Timeout
            </Label>
            <Select
              value={settings?.timeout?.toString()}
              onValueChange={(value) => 
                updateSettingsMutation.mutate({ timeout: parseInt(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
              Auto-refresh Dashboard
            </Label>
            <Switch
              checked={settings?.autoRefresh}
              onCheckedChange={(checked) => 
                updateSettingsMutation.mutate({ autoRefresh: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </CardHeader>
        <CardContent className="p-6">
          {!recentLogs || recentLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getLogStatusColor(log.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {log.details}
                    </p>
                    <p className="text-xs text-gray-500">{formatLogTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
