import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pingService } from "./ping-service";
import { insertServerSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start ping service (non-blocking to prevent startup issues)
  setTimeout(() => {
    pingService.startScheduledPing().catch(error => {
      console.error("Failed to start ping service:", error);
    });
  }, 1000);

  // Server routes
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  app.post("/api/servers", async (req, res) => {
    try {
      const serverData = insertServerSchema.parse(req.body);
      const server = await storage.createServer(serverData);
      
      // Return the server immediately - let scheduled ping handle the monitoring
      res.json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid server data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create server" });
      }
    }
  });

  // Bulk import servers
  app.post("/api/servers/bulk", async (req, res) => {
    try {
      const { servers: serverList } = req.body;
      
      if (!Array.isArray(serverList)) {
        return res.status(400).json({ message: "Expected 'servers' to be an array" });
      }

      // Validate all servers before creating any
      const validatedServers = serverList.map(server => insertServerSchema.parse(server));
      
      // Create all servers
      const createdServers = await storage.createServers(validatedServers);
      
      // Ping all servers concurrently for faster bulk import
      const settings = await storage.getSettings();
      const pingPromises = createdServers.map(async (server) => {
        const result = await pingService.pingServer(server, settings.timeout);
        
        const updatedServer = await storage.updateServer(server.id, {
          status: result.success ? "online" : "offline",
          responseTime: result.responseTime || null,
          lastPing: new Date(),
        });

        await storage.createPingLog({
          serverId: server.id,
          status: result.success ? "success" : "failed",
          responseTime: result.responseTime || null,
          details: result.details,
        });

        return updatedServer;
      });

      const updatedServers = await Promise.all(pingPromises);
      
      res.json({ 
        message: `Successfully imported ${updatedServers.length} servers`,
        servers: updatedServers 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid server data", errors: error.errors });
      } else {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: "Failed to import servers" });
      }
    }
  });

  app.delete("/api/servers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Server not found" });
      }
      
      res.json({ message: "Server deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete server" });
    }
  });

  app.post("/api/servers/:id/ping", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.getServer(id);
      
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }

      const settings = await storage.getSettings();
      const result = await pingService.pingServer(server, settings.timeout);
      
      const updatedServer = await storage.updateServer(id, {
        status: result.success ? "online" : "offline",
        responseTime: result.responseTime || null,
        lastPing: new Date(),
      });

      await storage.createPingLog({
        serverId: id,
        status: result.success ? "success" : "failed",
        responseTime: result.responseTime || null,
        details: result.details,
      });

      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: "Failed to ping server" });
    }
  });

  // Ping logs routes
  app.get("/api/ping-logs", async (req, res) => {
    try {
      const serverId = req.query.serverId ? parseInt(req.query.serverId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const logs = await storage.getPingLogs(serverId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ping logs" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(settingsData);
      
      // Update ping schedule if interval changed
      if (settingsData.pingInterval) {
        await pingService.updateSchedule();
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const servers = await storage.getServers();
      const onlineCount = servers.filter(s => s.status === "online").length;
      const offlineCount = servers.filter(s => s.status === "offline").length;
      const totalCount = servers.length;
      
      const onlineServers = servers.filter(s => s.status === "online" && s.responseTime);
      const avgResponse = onlineServers.length > 0 
        ? Math.round(onlineServers.reduce((sum, s) => sum + (s.responseTime || 0), 0) / onlineServers.length)
        : 0;

      res.json({
        onlineCount,
        offlineCount,
        totalCount,
        avgResponse: avgResponse > 0 ? `${avgResponse}ms` : "N/A",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Refresh all servers
  app.post("/api/refresh-all", async (req, res) => {
    try {
      await pingService.pingAllServers();
      res.json({ message: "All servers refreshed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh servers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
