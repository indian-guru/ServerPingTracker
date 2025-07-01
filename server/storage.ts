import { servers, pingLogs, settings, type Server, type InsertServer, type PingLog, type InsertPingLog, type Settings, type InsertSettings } from "@shared/schema";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export interface IStorage {
  // Server operations
  getServers(): Promise<Server[]>;
  getServer(id: number): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  createServers(servers: InsertServer[]): Promise<Server[]>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: number): Promise<boolean>;

  // Ping log operations
  getPingLogs(serverId?: number, limit?: number): Promise<PingLog[]>;
  createPingLog(log: InsertPingLog): Promise<PingLog>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(updates: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private servers: Map<number, Server>;
  private pingLogs: PingLog[];
  private settings: Settings;
  private currentServerId: number;
  private currentPingLogId: number;
  private dataFile: string;

  constructor() {
    this.dataFile = join(process.cwd(), 'server-monitor-data.json');
    this.servers = new Map();
    this.pingLogs = [];
    this.currentServerId = 1;
    this.currentPingLogId = 1;
    this.settings = {
      id: 1,
      pingInterval: 60,
      timeout: 10,
      autoRefresh: true,
    };
    this.loadData();
  }

  private loadData() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        
        // Load servers
        if (data.servers) {
          this.servers = new Map();
          data.servers.forEach((server: any) => {
            this.servers.set(server.id, {
              ...server,
              createdAt: new Date(server.createdAt),
              lastPing: server.lastPing ? new Date(server.lastPing) : null,
            });
          });
          this.currentServerId = Math.max(...data.servers.map((s: any) => s.id), 0) + 1;
        }
        
        // Load ping logs
        if (data.pingLogs) {
          this.pingLogs = data.pingLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
          }));
          this.currentPingLogId = Math.max(...data.pingLogs.map((l: any) => l.id), 0) + 1;
        }
        
        // Load settings
        if (data.settings) {
          this.settings = data.settings;
        }
      }
    } catch (error) {
      console.error('Failed to load data from file:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        servers: Array.from(this.servers.values()),
        pingLogs: this.pingLogs,
        settings: this.settings,
      };
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save data to file:', error);
    }
  }

  async getServers(): Promise<Server[]> {
    return Array.from(this.servers.values());
  }

  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const id = this.currentServerId++;
    const server: Server = {
      id,
      hostname: insertServer.hostname,
      ip: insertServer.ip,
      displayName: insertServer.displayName || null,
      status: "unknown",
      responseTime: null,
      lastPing: null,
      createdAt: new Date(),
    };
    this.servers.set(id, server);
    this.saveData();
    return server;
  }

  async createServers(insertServers: InsertServer[]): Promise<Server[]> {
    const createdServers: Server[] = [];
    
    for (const insertServer of insertServers) {
      const id = this.currentServerId++;
      const server: Server = {
        id,
        hostname: insertServer.hostname,
        ip: insertServer.ip,
        displayName: insertServer.displayName || null,
        status: "unknown",
        responseTime: null,
        lastPing: null,
        createdAt: new Date(),
      };
      this.servers.set(id, server);
      createdServers.push(server);
    }
    
    this.saveData();
    return createdServers;
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;

    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    this.saveData();
    return updatedServer;
  }

  async deleteServer(id: number): Promise<boolean> {
    const deleted = this.servers.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  async getPingLogs(serverId?: number, limit: number = 100): Promise<PingLog[]> {
    let logs = [...this.pingLogs];
    
    if (serverId) {
      logs = logs.filter(log => log.serverId === serverId);
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return logs.slice(0, limit);
  }

  async createPingLog(insertLog: InsertPingLog): Promise<PingLog> {
    const id = this.currentPingLogId++;
    const log: PingLog = {
      id,
      serverId: insertLog.serverId,
      status: insertLog.status,
      responseTime: insertLog.responseTime ?? null,
      details: insertLog.details || null,
      timestamp: new Date(),
    };
    this.pingLogs.push(log);
    
    // Keep only the last 1000 logs to prevent unlimited growth
    if (this.pingLogs.length > 1000) {
      this.pingLogs = this.pingLogs.slice(-1000);
    }
    
    this.saveData();
    return log;
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    this.saveData();
    return this.settings;
  }
}

export const storage = new MemStorage();
