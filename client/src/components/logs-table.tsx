import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PingLog, Server } from "@shared/schema";

export function LogsTable() {
  const [selectedServerId, setSelectedServerId] = useState<string>("all");
  
  const { data: servers } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const { data: logs, isLoading } = useQuery<PingLog[]>({
    queryKey: ["/api/ping-logs", selectedServerId === "all" ? undefined : parseInt(selectedServerId)],
    queryFn: () => {
      const url = selectedServerId === "all" 
        ? "/api/ping-logs?limit=50"
        : `/api/ping-logs?serverId=${selectedServerId}&limit=50`;
      return fetch(url).then(res => res.json());
    },
  });

  const getServerInfo = (serverId: number) => {
    const server = servers?.find(s => s.id === serverId);
    return {
      hostname: server?.displayName || server?.hostname || `Server ${serverId}`,
      ip: server?.ip || server?.hostname || "Unknown",
    };
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportLogs = () => {
    if (!logs) return;
    
    const csvContent = [
      ["Timestamp", "Server", "IP", "Status", "Response Time", "Details"].join(","),
      ...logs.map(log => {
        const serverInfo = getServerInfo(log.serverId);
        return [
          formatTimestamp(log.timestamp),
          serverInfo.hostname,
          serverInfo.ip,
          log.status,
          log.responseTime ? `${log.responseTime}ms` : "-",
          log.details || "",
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ping-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Ping Logs</h2>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Ping Logs</h2>
          <div className="flex space-x-2">
            <Select value={selectedServerId} onValueChange={setSelectedServerId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Servers</SelectItem>
                {servers?.map(server => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    {server.displayName || server.hostname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={exportLogs}
              disabled={!logs || logs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No ping logs available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Server
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const serverInfo = getServerInfo(log.serverId);
                  return (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {serverInfo.hostname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {serverInfo.ip}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={log.status === "success" ? "default" : "destructive"}
                          className={
                            log.status === "success" 
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {log.status === "success" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {log.status === "success" ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.responseTime ? `${log.responseTime}ms` : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </div>
  );
}
