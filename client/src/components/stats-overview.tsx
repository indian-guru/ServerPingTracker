import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Server, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  onlineCount: number;
  offlineCount: number;
  totalCount: number;
  avgResponse: string;
}

export function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-success text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Servers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.onlineCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="text-error text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Offline Servers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.offlineCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Server className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Servers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="text-warning text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgResponse || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
