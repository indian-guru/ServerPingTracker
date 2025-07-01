# Server Monitoring Dashboard

A comprehensive web application for monitoring server uptime and performance with automated ping services, real-time dashboard, and detailed logging.

## Features

- **Real-time Server Monitoring**: Automated ping service with configurable intervals
- **Interactive Dashboard**: Live server status, response times, and statistics
- **Bulk Import**: Add multiple servers via CSV or JSON format
- **Persistent Data**: File-based storage that persists across restarts
- **Detailed Logging**: Historical ping logs with export functionality
- **Responsive UI**: Modern React interface with Tailwind CSS

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment

1. **Install dependencies:**
```bash
npm install
```

2. **Build the application:**
```bash
npm run build
```

3. **Start the production server:**
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Manual Deployment Steps

1. **Download/clone the project files to your local server**

2. **Install Node.js 18+ on your local server**

3. **Copy the production package.json:**
```bash
cp package-production.json package.json
```

4. **Install dependencies:**
```bash
npm install
```

5. **Build the application:**
```bash
npm run build
```

6. **Start the server:**
```bash
npm start
```

## Configuration

- **Ping Interval**: Configurable via the Settings panel (default: 60 seconds)
- **Timeout**: Request timeout for ping operations (default: 10 seconds)
- **Auto-refresh**: Dashboard auto-refresh toggle
- **Port**: Server runs on port 5000 (configurable via PORT environment variable)

## Data Storage

The application uses file-based storage (`server-monitor-data.json`) which automatically persists:
- Server configurations
- Ping logs and history
- Application settings

## API Endpoints

- `GET /api/servers` - List all servers
- `POST /api/servers` - Add a new server
- `POST /api/servers/bulk` - Bulk import servers
- `DELETE /api/servers/:id` - Remove a server
- `GET /api/ping-logs` - Get ping history
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update settings

## Local Network Benefits

When running on your local network, the application can:
- Monitor local servers and devices
- Test internal network connectivity
- Access private IP ranges (192.168.x.x, 10.x.x.x, etc.)
- Monitor services not exposed to the internet

## System Requirements

- Node.js 18.0.0 or higher
- 100MB free disk space
- Network access to monitored servers

## Troubleshooting

**Port already in use:**
```bash
PORT=3000 npm start  # Use different port
```

**Permission issues:**
```bash
sudo npm start  # Run with elevated privileges if needed
```

**Data persistence:**
Ensure the application has write permissions in the directory for `server-monitor-data.json`