# Server Monitoring Dashboard - Replit.md

## Overview

This is a full-stack web application for monitoring server uptime and performance. The system provides real-time server status monitoring, ping logging, and a comprehensive dashboard for managing multiple servers. It uses a modern React frontend with a Node.js/Express backend, and is configured to use PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Scheduling**: Node-cron for automated ping scheduling
- **Development**: Memory storage fallback for development environments

### Key Components

#### Server Management
- **Purpose**: CRUD operations for server monitoring targets
- **Implementation**: RESTful API endpoints with validation
- **Features**: Support for both IP addresses and hostnames, display name customization

#### Ping Service
- **Purpose**: Automated server health monitoring
- **Implementation**: Cron-based scheduling with configurable intervals
- **Method**: System ping command execution with timeout handling
- **Logging**: Detailed ping results with response times and failure details

#### Real-time Dashboard
- **Purpose**: Live monitoring interface with statistics
- **Features**: Server status overview, response time tracking, historical logs
- **Auto-refresh**: Configurable automatic data refresh

#### Settings Management
- **Purpose**: User-configurable monitoring parameters
- **Options**: Ping interval, timeout duration, auto-refresh toggle

## Data Flow

1. **Server Registration**: Users add servers via the dashboard modal
2. **Automated Monitoring**: Cron job pings all registered servers at configured intervals
3. **Data Storage**: Ping results are stored in PostgreSQL with timestamps
4. **Real-time Updates**: Frontend polls API endpoints and updates dashboard
5. **Historical Analysis**: Logs table provides detailed ping history with filtering

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **drizzle-zod**: Database schema validation
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution
- **esbuild**: Production bundling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with hot module replacement
- **Backend**: Direct TypeScript execution with tsx
- **Database**: Memory storage for quick development iteration
- **Auto-refresh**: Enabled by default for development

### Production Environment
- **Frontend**: Static build served by Express
- **Backend**: Compiled JavaScript bundle
- **Database**: PostgreSQL via Neon Database connection
- **Process**: Single Node.js process serving both frontend and API

### Build Process
1. Frontend assets compiled to `dist/public`
2. Backend bundled to `dist/index.js`
3. Database migrations applied via Drizzle Kit
4. Environment variables configured for database connection

## Changelog
- July 01, 2025: Initial setup - Complete server monitoring application built and tested
  - Database schema designed for servers, ping logs, and settings
  - Automated ping service with configurable intervals
  - Full REST API with comprehensive endpoints
  - Modern React dashboard with real-time monitoring
  - Settings panel for customization
  - Detailed logs table with export functionality
  - Successfully tested with live server monitoring

## User Preferences

Preferred communication style: Simple, everyday language.