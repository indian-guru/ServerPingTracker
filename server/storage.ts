import { servers, pingLogs, settings, type Server, type InsertServer, type PingLog, type InsertPingLog, type Settings, type InsertSettings } from "@shared/schema";

export interface IStorage {
  // Server operations
  getServers(): Promise<Server[]>;
  getServer(id: number): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
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

  constructor() {
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
      ...insertServer,
      status: "unknown",
      responseTime: null,
      lastPing: null,
      createdAt: new Date(),
    };
    this.servers.set(id, server);
    return server;
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;

    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteServer(id: number): Promise<boolean> {
    return this.servers.delete(id);
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
      ...insertLog,
      timestamp: new Date(),
    };
    this.pingLogs.push(log);
    return log;
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

export const storage = new MemStorage();
