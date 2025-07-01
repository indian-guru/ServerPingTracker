import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsOverview } from "@/components/stats-overview";
import { ServerList } from "@/components/server-list";
import { SettingsPanel } from "@/components/settings-panel";
import { LogsTable } from "@/components/logs-table";
import { AddServerModal } from "@/components/add-server-modal";
import { BulkImportModal } from "@/components/bulk-import-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  const { data: settings } = useQuery<{ autoRefresh?: boolean }>({
    queryKey: ["/api/settings"],
  });

  // Auto-refresh functionality
  useEffect(() => {
    if (settings?.autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ping-logs"] });
        setLastUpdate(new Date());
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [settings?.autoRefresh]);

  const handleRefreshAll = async () => {
    try {
      await apiRequest("POST", "/api/refresh-all");
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ping-logs"] });
      setLastUpdate(new Date());
      toast({
        title: "Success",
        description: "All servers refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh servers",
        variant: "destructive",
      });
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Server Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: <span className="font-medium">{formatLastUpdate(lastUpdate)}</span>
              </span>
              <Button onClick={handleRefreshAll} className="bg-primary hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh All
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Server List */}
          <div className="lg:col-span-2">
            <ServerList 
              onAddServer={() => setIsAddModalOpen(true)}
              onBulkImport={() => setIsBulkImportModalOpen(true)}
            />
          </div>

          {/* Settings Panel */}
          <SettingsPanel />
        </div>

        {/* Logs Table */}
        <LogsTable />
      </div>

      {/* Add Server Modal */}
      <AddServerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
      />
    </div>
  );
}
