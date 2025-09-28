# MarketDifferentials - AI-Powered Financial Learning Platform

## Overview

MarketDifferentials is a comprehensive full-stack web application for financial education and market analysis. The platform combines modern web technologies to deliver an interactive learning experience with AI-powered support, course management, and anomaly detection capabilities. Built with React/TypeScript frontend, Express/Node.js backend, and PostgreSQL database, it features Firebase authentication, real-time AI chat support via OpenAI, and advanced data visualization tools for financial analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query for server state and React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts for data visualization and financial analytics

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Custom logging, error handling, and CORS configuration
- **File Structure**: Modular design with separate routes, storage, and utility modules

### Authentication & Authorization
- **Primary Auth**: Firebase Authentication supporting email/password and Google OAuth
- **Session Management**: Firebase session cookies with persistence options
- **Role-Based Access**: Admin approval system with user roles (student/admin)
- **Protected Routes**: Client-side route guards based on authentication status

### Database & ORM
- **Database**: PostgreSQL as primary data store
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Management**: Shared schema between client and server using Zod validation
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: Neon Database serverless PostgreSQL

### Data Models
Key entities include Users, Courses, Enrollments, Quizzes, Support Messages, CSV Uploads, and Anomalies with proper foreign key relationships and indexing.

### External Dependencies

#### Cloud Services
- **Firebase**: Authentication service with Google OAuth integration
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI API**: GPT integration for AI-powered support chat

#### Frontend Dependencies
- **UI Framework**: React with shadcn/ui component system
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for financial data visualization
- **Icons**: Lucide React and Font Awesome integration

#### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL adapter
- **API Client**: OpenAI SDK for chat functionality
- **Development**: TSX for TypeScript execution and hot reload

#### Build & Development
- **Build Tool**: Vite with React plugin and custom configuration
- **TypeScript**: Strict type checking with path mapping
- **Linting**: ESBuild for production bundling
- **Development**: Hot module replacement and error overlay

## Mobile Application
- **Framework:** Expo React Native
- **Location:** `apps/mobile/`
- **Start Command:** `cd apps/mobile && npx expo start`
- **Dependencies:** Expo Router, NativeWind, Victory Native, Stripe RN
- **Features:** Tab navigation, device detection, shared business logic
- **Configuration:** Metro bundler configured for monorepo support
- **Shared Code:** Uses @lms/shared package for business logic and schemas