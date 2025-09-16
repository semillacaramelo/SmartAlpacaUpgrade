# Smart Alpaca AI Trading System

## Overview

The Smart Alpaca AI Trading System is an autonomous AI-powered trading platform built with a full-stack TypeScript architecture. The system integrates Google Gemini AI for intelligent decision-making across market analysis, asset selection, strategy generation, and trade execution. It features a React dashboard for real-time monitoring, Express.js backend with REST APIs, and comprehensive database management using Drizzle ORM with PostgreSQL.

The application follows a microservices-inspired architecture with distinct separation between frontend client, backend server, and shared schema definitions. It implements real-time WebSocket communication for live trading updates and includes comprehensive audit logging and system health monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: Custom WebSocket hook for live trading data updates
- **Component Structure**: Dashboard-focused layout with modular components for trading metrics, AI pipeline visualization, active positions, and system health monitoring

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful APIs with structured error handling and logging middleware
- **Real-time Features**: WebSocket server for live data streaming to frontend
- **Services Layer**: Modular service architecture including trading service, task management, Gemini AI integration, and WebSocket management
- **Middleware**: Request logging, JSON parsing, and CORS handling

### Database Design
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless provider
- **Schema Structure**: Comprehensive trading-focused schema including users, portfolios, positions, trades, strategies, AI decisions, audit logs, and system health tables
- **Migration Management**: Drizzle Kit for schema migrations with organized migration files
- **Connection Pooling**: Neon serverless pool for efficient database connections

### AI Integration Architecture
- **AI Provider**: Google Gemini AI for trading decision intelligence
- **Decision Pipeline**: Multi-stage AI pipeline including market analysis, asset selection, strategy generation, risk validation, and execution planning
- **Task Management**: Celery-inspired task system for autonomous trading cycles
- **Audit Trail**: Comprehensive logging of all AI decisions with correlation IDs for tracking

### Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Environment Configuration**: Secure environment variable management for API keys and database credentials
- **API Security**: Input validation using Zod schemas and structured error responses

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for primary data storage
- **AI Service**: Google Gemini AI API for trading intelligence and decision-making
- **Trading API**: Alpaca Markets API for trade execution and market data (configured but not fully implemented in current codebase)

### Development & Build Tools
- **Package Manager**: npm with extensive TypeScript and React ecosystem dependencies
- **Build System**: Vite for frontend bundling with ESBuild for server compilation
- **Development Environment**: Replit-specific plugins for development experience including error overlay and cartographer
- **UI Components**: Extensive Radix UI component library for accessible, customizable interface elements

### Runtime Dependencies
- **WebSocket**: ws library for real-time server communication
- **Date Handling**: date-fns for consistent date manipulation
- **Validation**: Zod for runtime type validation and schema definition
- **HTTP Client**: Native fetch API with custom query client wrapper
- **Styling**: Tailwind CSS with class-variance-authority for component variants