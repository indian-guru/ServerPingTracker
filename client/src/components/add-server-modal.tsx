import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertServerSchema } from "@shared/schema";
import { z } from "zod";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddServerModal({ isOpen, onClose }: AddServerModalProps) {
  const [serverType, setServerType] = useState<"ip" | "hostname">("ip");
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const addServerMutation = useMutation({
    mutationFn: (data: { hostname: string; ip: string; displayName?: string }) =>
      apiRequest("POST", "/api/servers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Server added successfully",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add server",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setAddress("");
    setDisplayName("");
    setServerType("ip");
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!address.trim()) {
      newErrors.address = "Address is required";
    } else if (serverType === "ip") {
      // Basic IP validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(address.trim())) {
        newErrors.address = "Please enter a valid IP address";
      }
    } else {
      // Basic hostname validation
      const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!hostnameRegex.test(address.trim())) {
        newErrors.address = "Please enter a valid hostname";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const serverData = {
        hostname: serverType === "hostname" ? address.trim() : displayName.trim() || address.trim(),
        ip: serverType === "ip" ? address.trim() : address.trim(),
        displayName: displayName.trim() || undefined,
      };

      insertServerSchema.parse(serverData);
      addServerMutation.mutate(serverData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Add Server
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Server Type
            </Label>
            <RadioGroup 
              value={serverType} 
              onValueChange={(value: "ip" | "hostname") => setServerType(value)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ip" id="ip" />
                <Label htmlFor="ip" className="text-sm font-medium text-gray-900 cursor-pointer">
                  IP Address
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hostname" id="hostname" />
                <Label htmlFor="hostname" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Hostname
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
              {serverType === "ip" ? "IP Address" : "Hostname"}
            </Label>
            <Input
              id="address"
              type="text"
              placeholder={serverType === "ip" ? "e.g., 192.168.1.100" : "e.g., server.local"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 mb-2 block">
              Display Name (Optional)
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="e.g., Web Server 01"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
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
              disabled={addServerMutation.isPending}
              className="bg-primary hover:bg-blue-700"
            >
              {addServerMutation.isPending ? "Adding..." : "Add Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
