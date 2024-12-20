# Workout Challenge Application Requirements

## Setup & Frameworks

- Use Svelte 5 + Vite as the build setup
- Use JavaScript (no TypeScript)
- Use shadcn-svelte for UI components and styling
- Use Supabase for backend and authentication
- Deploy as a static site build

## Core Features

### Authentication & User Management
- Email/password authentication via Supabase
- User profile management
- Secure data access with Row Level Security (RLS)
- Handle login, logout, and session persistence

### Workout Challenge Timeline
- 90-day (3-month) workout challenge timeline
- Sigmoidal progression curve: 15 minutes (Day 1) to 90 minutes (Day 90)
- Adjustable parameters:
  - Start time
  - End time
  - Steepness
  - Midpoint
- User-configurable workout days per week (e.g., 3 or 4)
- Visual states:
  - Projected workouts: low-alpha or dotted outlines
  - Completed workouts: fully opaque
- Multiple workout sessions per day allowed

### Analytics
- Total workouts completed
- Average workouts per week
- Average total workout time per week
- Real-time updates when data changes

## Data Persistence
- Primary storage in Supabase database:
  - User preferences
  - Completed workouts
  - Curve parameters
- Optional localStorage for offline functionality
- Real-time sync with Supabase

## Calendar Integration
- Configurable start date
- Calendar/timeline view for 90 days
- Sync with database on changes

## Implementation Details

### Database Schema
- users (managed by Supabase Auth)
- user_preferences
  - days_per_week
  - start_date
  - sigmoid_params (JSON)
- workouts
  - user_id (with RLS)
  - date
  - duration
  - created_at

### Component Structure
- Modular components for each major feature
- Responsive design principles
- shadcn-svelte integration for UI elements
- Auth components for user management

### Data Flow
- Centralized state management using Svelte stores
- Integration with Supabase client
- Real-time analytics updates
- Persistent storage synchronization
- Error handling for network issues

### Security
- Row Level Security (RLS) policies
- Secure authentication flow
- Protected API endpoints
- Data validation

### Testing Strategy
- Unit tests for sigmoidal calculations
- Integration tests for workout logging
- Storage persistence verification
- Authentication flow testing
- Database operation testing

### Error Handling
- Graceful degradation when offline
- User-friendly error messages
- Loading states during data fetches
- Retry mechanisms for failed operations

### Deployment
- Environment variable management
- Build optimization
- Supabase project configuration
- Static site hosting (Vercel/Netlify)
