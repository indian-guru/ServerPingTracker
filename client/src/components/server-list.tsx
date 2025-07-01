import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Server } from "@shared/schema";

interface ServerListProps {
  onAddServer: () => void;
}

export function ServerList({ onAddServer }: ServerListProps) {
  const { toast } = useToast();
  
  const { data: servers, isLoading } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const deleteServerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/servers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    },
  });

  const pingServerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/servers/${id}/ping`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ping-logs"] });
      toast({
        title: "Success",
        description: "Server pinged successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to ping server",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-success";
      case "offline":
        return "bg-error";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "text-success";
      case "offline":
        return "text-error";
      default:
        return "text-gray-500";
    }
  };

  const getCardBorder = (status: string) => {
    return status === "offline" 
      ? "border-red-200 bg-red-50" 
      : "border-gray-200 hover:border-gray-300";
  };

  const formatLastPing = (lastPing: string | null) => {
    if (!lastPing) return "Never";
    
    const date = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 min ago";
    return `${diffMins} min ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Server Status</h2>
            <Button onClick={onAddServer} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-16 h-5" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Server Status</h2>
          <Button onClick={onAddServer} className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!servers || servers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No servers configured yet.</p>
            <Button onClick={onAddServer} className="mt-4 bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Server
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div 
                key={server.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${getCardBorder(server.status)}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${getStatusColor(server.status)}`} />
                    <span className={`ml-2 text-sm font-medium ${getStatusText(server.status)} capitalize`}>
                      {server.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {server.displayName || server.hostname}
                    </p>
                    <p className="text-sm text-gray-500">{server.ip || server.hostname}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${server.status === 'offline' ? 'text-error' : 'text-gray-900'}`}>
                      {server.responseTime ? `${server.responseTime}ms` : (server.status === 'offline' ? 'Timeout' : 'Unknown')}
                    </p>
                    <p className="text-xs text-gray-500">{formatLastPing(server.lastPing)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => pingServerMutation.mutate(server.id)}
                      disabled={pingServerMutation.isPending}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <RefreshCw className={`w-4 h-4 ${pingServerMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteServerMutation.mutate(server.id)}
                      disabled={deleteServerMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
