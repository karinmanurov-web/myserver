# Vocabulary Room data architecture

Vocabulary Room is being moved from browser-only storage to a shared online service.

## Data boundaries

- The public library contains published vocabulary modules and word pairs.
- Signed-in users can create private drafts or submit modules for review.
- Per-user progress and saved sessions are private rows protected by Supabase Row Level Security.
- GitHub stores the application source code and this database schema. It is not used as a multi-user database.

## Why Supabase is used for runtime data

A public GitHub repository is excellent for hosting static files, but it is not a safe multi-user database. Writing to GitHub from browser JavaScript would require exposing a credential that could let visitors modify the repository. Vocabulary Room therefore uses Supabase for authentication, shared module records, personal progress, and resumable sessions. The public website only receives the Supabase project URL and anon/publishable key; Row Level Security protects user data. Never expose a service_role key.

## Setup

1. Create a Supabase project.
2. Open SQL Editor and run `schema.sql`.
3. In Authentication settings, enable email OTP/magic-link sign-in and configure the site's allowed redirect URLs.
4. Add the Supabase project URL and anon/publishable key to the app's public configuration.
5. Keep the service_role key private; it must never be committed to this repository or included in HTML/JS.
6. Import existing browser modules into the cloud library. Existing localStorage data is not automatically visible to the developer or other devices; the app must offer an explicit migration step in the user's browser.

## Publishing workflow

New modules are created as private drafts or pending submissions. They are not visible in the public library until approved and promoted to `visibility = 'public'` by a trusted admin workflow.

## Personal data

Progress and active session state are keyed by the authenticated Supabase user ID. RLS ensures a user can only read or write their own progress and sessions. A session save should include the exact phase, batch, question index, queue, current question IDs, and answer state so a reload can restore a valid question rather than silently advancing.
