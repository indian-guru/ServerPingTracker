import { exec } from "child_process";
import { promisify } from "util";
import * as cron from "node-cron";
import { storage } from "./storage";
import type { Server } from "@shared/schema";

const execAsync = promisify(exec);

export class PingService {
  private cronJob: cron.ScheduledTask | null = null;

  async pingServer(server: Server, timeoutSeconds: number = 10): Promise<{
    success: boolean;
    responseTime?: number;
    details: string;
  }> {
    const target = server.ip || server.hostname;
    
    try {
      // Use ping command with timeout
      const isWindows = process.platform === "win32";
      const pingCommand = isWindows 
        ? `ping -n 1 -w ${timeoutSeconds * 1000} ${target}`
        : `ping -c 1 -W ${timeoutSeconds} ${target}`;

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(pingCommand, {
        timeout: timeoutSeconds * 1000 + 1000, // Add 1 second buffer
      });
      const endTime = Date.now();

      if (stderr) {
        return {
          success: false,
          details: `Ping failed: ${stderr.trim()}`,
        };
      }

      // Extract response time from ping output
      let responseTime = endTime - startTime;
      
      // Try to extract more accurate timing from ping output
      const timeMatch = stdout.match(/time[<=](\d+(?:\.\d+)?)\s*ms/i);
      if (timeMatch) {
        responseTime = Math.round(parseFloat(timeMatch[1]));
      }

      return {
        success: true,
        responseTime,
        details: "Ping successful",
      };
    } catch (error: any) {
      return {
        success: false,
        details: error.code === 'ETIMEDOUT' 
          ? "Connection timeout" 
          : `Ping failed: ${error.message}`,
      };
    }
  }

  async pingAllServers(): Promise<void> {
    const servers = await storage.getServers();
    const settings = await storage.getSettings();

    for (const server of servers) {
      const result = await this.pingServer(server, settings.timeout);
      const newStatus = result.success ? "online" : "offline";
      
      // Update server status
      await storage.updateServer(server.id, {
        status: newStatus,
        responseTime: result.responseTime || null,
        lastPing: new Date(),
      });

      // Log the ping result
      await storage.createPingLog({
        serverId: server.id,
        status: result.success ? "success" : "failed",
        responseTime: result.responseTime || null,
        details: result.details,
      });
    }
  }

  async startScheduledPing(): Promise<void> {
    await this.stopScheduledPing();
    
    const settings = await storage.getSettings();
    const cronExpression = `*/${settings.pingInterval} * * * * *`; // Every N seconds
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        await this.pingAllServers();
      } catch (error) {
        console.error("Error during scheduled ping:", error);
      }
    });

    // Initial ping
    await this.pingAllServers();
  }

  async stopScheduledPing(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
  }

  async updateSchedule(): Promise<void> {
    if (this.cronJob) {
      await this.startScheduledPing();
    }
  }
}

export const pingService = new PingService();
