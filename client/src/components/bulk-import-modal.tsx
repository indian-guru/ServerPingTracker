import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Upload, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const { toast } = useToast();

  const bulkImportMutation = useMutation({
    mutationFn: (servers: any[]) => 
      apiRequest("POST", "/api/servers/bulk", { servers }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: data.message,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import servers",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setInput("");
    setFormat("csv");
    onClose();
  };

  const parseInput = (): any[] => {
    if (!input.trim()) return [];

    if (format === "json") {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        throw new Error("Invalid JSON format");
      }
    } else {
      // CSV format
      const lines = input.trim().split('\n');
      const servers: any[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 1) continue;
        
        const server: any = {
          hostname: parts[0],
          ip: parts[0], // Use same value for both if only one provided
        };
        
        // If second column provided, treat first as hostname and second as IP
        if (parts.length > 1 && parts[1]) {
          server.ip = parts[1];
        }
        
        // Third column is display name
        if (parts.length > 2 && parts[2]) {
          server.displayName = parts[2];
        }
        
        servers.push(server);
      }
      
      return servers;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const servers = parseInput();
      
      if (servers.length === 0) {
        toast({
          title: "Error",
          description: "No valid servers found in input",
          variant: "destructive",
        });
        return;
      }
      
      bulkImportMutation.mutate(servers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const csvExample = `google.com
github.com
example.com,192.0.2.1,Example Server
httpbin.org,,Test API`;

  const jsonExample = `[
  {"hostname": "google.com", "ip": "google.com"},
  {"hostname": "github.com", "ip": "github.com"},
  {"hostname": "example.com", "ip": "192.0.2.1", "displayName": "Example Server"}
]`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Bulk Import Servers
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex space-x-4">
            <Button
              type="button"
              variant={format === "csv" ? "default" : "outline"}
              onClick={() => setFormat("csv")}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              CSV Format
            </Button>
            <Button
              type="button"
              variant={format === "json" ? "default" : "outline"}
              onClick={() => setFormat("json")}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              JSON Format
            </Button>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Server List
            </Label>
            <Textarea
              placeholder={format === "csv" ? csvExample : jsonExample}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Format Guidelines:</h4>
            {format === "csv" ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p>• One server per line</p>
                <p>• Format: <code className="bg-gray-200 px-1 rounded">hostname[,ip][,displayName]</code></p>
                <p>• If only hostname is provided, it will be used for both hostname and IP</p>
                <p>• Display name is optional</p>
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Valid JSON array of server objects</p>
                <p>• Required fields: <code className="bg-gray-200 px-1 rounded">hostname</code>, <code className="bg-gray-200 px-1 rounded">ip</code></p>
                <p>• Optional field: <code className="bg-gray-200 px-1 rounded">displayName</code></p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={bulkImportMutation.isPending || !input.trim()}
              className="bg-primary hover:bg-blue-700"
            >
              {bulkImportMutation.isPending ? "Importing..." : "Import Servers"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}