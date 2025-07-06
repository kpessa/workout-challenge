# Project Structure

project-root/
  ├─ src/
  │   ├─ lib/
  │   │   ├─ components/
  │   │   │   ├─ Auth.svelte             // Authentication component for login/signup
  │   │   │   ├─ Calendar.svelte         // Calendar or timeline component for the 90 days
  │   │   │   ├─ ControlsPanel.svelte    // UI for adjusting sigmoidal parameters & schedule
  │   │   │   ├─ ProgressChart.svelte    // Chart to display the sigmoidal progression
  │   │   │   ├─ WorkoutLog.svelte       // Component to log workouts (multiple per day)
  │   │   │   ├─ AnalyticsPanel.svelte   // Display total workouts, averages, etc.
  │   │   │   ├─ Layout.svelte           // Main layout wrapper (header, footer, etc.)
  │   │   │   └─ UI/                     // Folder for any custom wrappers around shadcn-svelte components
  │   │   ├─ stores/
  │   │   │   ├─ authStore.js            // Svelte store for authentication state
  │   │   │   ├─ userPreferencesStore.js // Svelte store for user preferences (days/week, start date)
  │   │   │   ├─ scheduleStore.js        // Store for projected and completed workouts
  │   │   │   ├─ analyticsStore.js       // Derived store for computed values (averages, totals)
  │   │   │   └─ curveParamsStore.js     // Store for sigmoidal curve parameters
  │   │   ├─ utils/
  │   │   │   ├─ sigmoidal.js            // Functions to compute sigmoidal progression
  │   │   │   ├─ localStorageHelpers.js  // Functions for localStorage get/set
  │   │   │   └─ dateUtils.js            // Helper functions for date math and formatting
  │   │   ├─ styles/
  │   │   │   └─ global.css              // Global stylesheet (if needed)
  │   │   ├─ shadcn/                     // shadcn-svelte components (if you choose to customize)
  │   │   ├─ firebase.js                 // Firebase client initialization
  │   │   └─ data/
  │   │       └─ defaultParams.json      // Default curve parameters and other default settings
  │   ├─ routes/
  │   │   └─ +page.svelte               // Main page that imports components and orchestrates the UI
  │   ├─ app.d.ts                       // (Optional) If you prefer no TS at all, you can remove this
  │   └─ main.js                        // Main entry point initializing the app
  ├─ public/
  │   └─ favicon.png
  ├─ .env                               // Environment variables for Supabase configuration
  ├─ svelte.config.js
  ├─ vite.config.js
  ├─ package.json
  ├─ postcss.config.js
  ├─ tailwind.config.js (if you use Tailwind with shadcn-svelte)
  └─ README.md
