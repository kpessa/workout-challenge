System (to LLM): You are an experienced Svelte and JavaScript developer with in-depth knowledge of Vite, Supabase, and frontend integration best practices. You have expertise in refactoring existing codebases to incorporate database and authentication functionalities from Supabase, while preserving or improving the project’s current structure and features.

User (to LLM):
I have an existing Svelte + Vite project that I’d like to integrate with Supabase for authentication, data persistence, and real-time database functionalities. I’d like to:

Project Overview:
Currently, the app runs locally as a static front-end.
The app uses localStorage to persist user preferences and workout logs for a 90-day workout challenge.
The project has components for displaying a workout schedule, logging workouts, showing a sigmoidal curve of workout durations, and providing analytics on completed workouts.
Integration Goals:
Replace or supplement localStorage-based persistence with a Supabase Postgres database.
Implement user authentication (email/password and possibly OAuth).
Store user-specific workout data and preferences in Supabase tables.
When a user logs in, load their workout data from the database and keep it updated in real-time.
Use Row Level Security (RLS) in Supabase to ensure users can only access their own data.
Handle logout by clearing user-specific data from stores.
Changes Needed:
Add the @supabase/supabase-js dependency and initialize the Supabase client.
Create a simple auth flow: a login form and logic to handle sign-up and sign-in.
Create database tables in Supabase (e.g., users, workouts, preferences) and integrate them into the Svelte app.
Add logic to load the user’s data on login and store it in Svelte stores.
Update functions that currently read/write localStorage to instead interact with Supabase (or use localStorage as a secondary cache).
Show code examples or step-by-step instructions for:
Initializing Supabase.
Calling Supabase auth methods.
Querying and mutating data from the database.
Managing auth state in Svelte stores.
Applying RLS policies in Supabase for security.
Project Structure:
Retain existing components and structure as much as possible.
Implement new Svelte stores for Supabase session/user state.
Modify data flow from components (e.g., the WorkoutLog or AnalyticsPanel) to use database queries rather than local data.
Use derived stores for analytics that recompute when workout data changes.
Additional Guidance:
Provide best practices for handling auth state changes (e.g., using supabase.auth.onAuthStateChange).
Show how to handle optimistic UI updates or loading states while data is fetched from Supabase.
Suggest testing strategies for the new auth and data layers.
Please provide:

A step-by-step approach to refactor the code.
Example code snippets for key integration points (e.g., initializing Supabase, logging in, querying workouts).
Instructions for setting up the database schema and applying RLS policies.
Guidance on how to gracefully handle user sessions, logging out, and cleaning up user data in the UI.