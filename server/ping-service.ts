import * as cron from "node-cron";
import { createConnection } from "net";
import { storage } from "./storage";
import type { Server } from "@shared/schema";

export class PingService {
  private cronJob: cron.ScheduledTask | null = null;

  async pingServer(server: Server, timeoutSeconds: number = 10): Promise<{
    success: boolean;
    responseTime?: number;
    details: string;
  }> {
    const target = server.ip || server.hostname;
    
    // For local/private IP addresses, try TCP first as they may not have HTTP services
    const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.|localhost)/i.test(target);
    
    if (isLocalIP) {
      // Try TCP connection test first for local servers
      const tcpResult = await this.tcpPing(target, Math.min(timeoutSeconds, 5));
      if (tcpResult.success) {
        return tcpResult;
      }
      
      // If TCP fails, try HTTP as fallback
      return await this.httpPing(target, Math.min(timeoutSeconds, 3));
    } else {
      // Try HTTP/HTTPS connectivity first for external servers
      const httpResult = await this.httpPing(target, timeoutSeconds);
      if (httpResult.success) {
        return httpResult;
      }
      
      // If HTTP fails, try TCP connection test
      return await this.tcpPing(target, timeoutSeconds);
    }
  }

  private async httpPing(target: string, timeoutSeconds: number): Promise<{
    success: boolean;
    responseTime?: number;
    details: string;
  }> {
    // Determine if target is an IP address or hostname
    const isIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(target);
    
    // For hostnames, try HTTPS first then HTTP; for IPs, try HTTP first
    const protocols = isIP ? ['http', 'https'] : ['https', 'http'];
    
    for (const protocol of protocols) {
      try {
        const url = `${protocol}://${target}`;
        const startTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
        
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Server-Monitor/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Consider any HTTP status code 200-499 as successful (server is responding)
        if (response.status >= 200 && response.status < 500) {
          return {
            success: true,
            responseTime,
            details: `${protocol.toUpperCase()} ${response.status} ${response.statusText}`,
          };
        } else {
          return {
            success: false,
            details: `${protocol.toUpperCase()} ${response.status} ${response.statusText}`,
          };
        }
        
      } catch (error: any) {
        console.log(`HTTP ping failed for ${protocol}://${target}:`, error.message);
        
        if (error.name === 'AbortError') {
          return {
            success: false,
            details: "Connection timeout",
          };
        }
        
        // Continue to next protocol if this one fails
        continue;
      }
    }
    
    return {
      success: false,
      details: "No HTTP/HTTPS response",
    };
  }

  private async tcpPing(target: string, timeoutSeconds: number): Promise<{
    success: boolean;
    responseTime?: number;
    details: string;
  }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Try common ports for connectivity test - prioritize local services
      const ports = [22, 80, 443, 3389, 5900, 23, 21, 25, 53, 135, 445, 8080, 8443];
      let successfulConnections = 0;
      let completedAttempts = 0;
      
      const tryPort = (port: number) => {
        const socket = createConnection({
          host: target,
          port: port,
          timeout: Math.min(timeoutSeconds * 1000, 2000) // Max 2 seconds per port for local servers
        });

        socket.on('connect', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          socket.destroy();
          resolve({
            success: true,
            responseTime,
            details: `TCP connection successful on port ${port}`,
          });
        });

        socket.on('error', () => {
          socket.destroy();
          completedAttempts++;
          if (completedAttempts === ports.length && successfulConnections === 0) {
            resolve({
              success: false,
              details: `No response on common ports (${ports.join(', ')})`,
            });
          }
        });

        socket.on('timeout', () => {
          socket.destroy();
          completedAttempts++;
          if (completedAttempts === ports.length && successfulConnections === 0) {
            resolve({
              success: false,
              details: "Connection timeout on all ports",
            });
          }
        });
      };

      // Try the first port, if it fails quickly try others
      tryPort(ports[0]);
      
      // Set a fallback timeout
      setTimeout(() => {
        if (completedAttempts === 0) {
          resolve({
            success: false,
            details: "Connection timeout",
          });
        }
      }, timeoutSeconds * 1000);
    });
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

    // Initial ping (don't await to prevent startup blocking)
    this.pingAllServers().catch(error => {
      console.error("Error during initial ping:", error);
    });
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
