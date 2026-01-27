# HomeCoreOS

**Your Personal Operating System for Productivity.**

HomeCoreOS is a modern, secure, and privacy-focused application for managing your life. It combines a powerful task manager, a recipe organizer, and more into a single unified workspace.

> **Coming Soon:** We are working on a hosted cloud version at **HomeCore.com**. Stay tuned!

## Features

- **✅ Task Management**: Organize, categorize, and track your to-dos with an "Optimistic UI" for instant feedback.
- **🍳 Recipe Organizer**: Save your favorite recipes, calculate macros (calories, protein, etc.), and search ingredients with simulated database lookups.
- **🔐 Enterprise-Grade Security**: Built on Supabase with strict Row Level Security (RLS). Your data is yours.
- **⚡ Hybrid Architecture**: Leverages Next.js Server Components for maximum performance and SEO, with isolated Client Components for interactivity.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (Postgres + Auth)
- **UI Library**: Mantine UI
- **Language**: TypeScript

## Getting Started

This project is "Semi Open Source". You are free to run it locally on your own machine.

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Supabase CLI** (for local database setup)
3.  **Docker** (required by Supabase CLI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/homecoreos.git
    cd homecoreos
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Local Supabase:**
    Ensure Docker is running, then start Supabase:
    ```bash
    npx supabase start
    ```
    *This will spin up a local Postgres database, Auth server, and API gateway.*

4.  **Configure Environment:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in the values output by the `supabase start` command:
    - `NEXT_PUBLIC_SUPABASE_URL`: API URL from Supabase CLI output.
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: `anon` key from Supabase CLI output.

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Roadmap

- [x] **Core**: Authentication, Navigation, Settings
- [x] **Modules**: Tasks, Recipes
- [ ] **Data Sync**: Offline support
- [ ] **HomeCore Cloud**: Hosted version (Coming Soon)

## License

**AGPL-3.0 License**

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

*   You are free to use, modify, and distribute this software.
*   If you modify it and run it as a service/website, you **must** provide the source code to your users.
*   See the `LICENSE` file for full details.

---

*Copyright (C) 2026 feldenserra*
