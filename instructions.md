# Workout Challenge Application Requirements

## Setup & Frameworks

- Use Svelte 5 + Vite as the build setup
- Use JavaScript (no TypeScript)
- Use shadcn-svelte for UI components and styling
- Deploy as a static site build

## Core Features

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

## Data Persistence
- Use localStorage to persist:
  - User preferences
  - Completed workouts
  - Curve parameters

## Calendar Integration
- Configurable start date
- Calendar/timeline view for 90 days

## Implementation Details

### Component Structure
- Modular components for each major feature
- Responsive design principles
- shadcn-svelte integration for UI elements

### Data Flow
- Centralized state management using Svelte stores
- Real-time analytics updates
- Persistent storage synchronization

### Testing Strategy
- Unit tests for sigmoidal calculations
- Integration tests for workout logging
- Storage persistence verification
