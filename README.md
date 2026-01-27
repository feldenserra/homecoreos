# HomeCoreOS

**The modern, secure All-In-One Operating System for your life.**

There are so many things to track and manage in the modern day. No app out there exists that does everything I need it to do — simply, minimally, and effectively.

So I built **HomeCoreOS**.

It is designed to be the single source of truth for your personal life. No more juggling 5 different apps for habits, groceries, tasks, and workouts. HomeCoreOS brings it all together in a private, high-performance workspace.

> **HomeCore Cloud (Coming Soon)**: White-glove hosting at **[HomeCore.com](https://homecore.com)**. Support the development and get hassle-free hosting, or run it yourself for free below.

## Features

- **✅ Task Management**: Organize, categorize, and track your to-dos with instant "Optimistic UI".
- **🍳 Recipe Organizer**: Save recipes, calculate macros, and manage your kitchen.
- **🔐 Enterprise-Grade Security**: Your data is yours. Protected by Supabase Row Level Security (RLS).
- **⚡ Hybrid Architecture**: Built with Next.js Server Components for maximum speed and SEO.

## Roadmap (Coming Soon)

We are actively building the ultimate life-management suite:

- [ ] **🏋️ Workout Tracker**: Log sets, reps, and progress.
- [ ] **⚖️ Weight & Health**: Track body metrics over time.
- [ ] **📅 Appointments**: Smart reminders and calendar integration.
- [ ] **Hz Re-occurring Tasks**: Powerful engine for daily, weekly, or custom repeating tasks.
- [ ] **📋 Templates**: Save and reuse project structures.
- [ ] **fw Community Board**: Share and download "Life Packs" (e.g., "Yearly Home Maintenance", "Spring Cleaning Checklist") driven by the community.

## Getting Started

This project is **"Semi Open Source" (Fair Code)**.
You are free to download and run this code locally **for free** for personal use.

### Prerequisites

1.  **Node.js** (v18+)
2.  **Supabase CLI** (for local database)
3.  **Docker** (required by Supabase)

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

3.  **Start Local Database:**
    ```bash
    npx supabase start
    ```

4.  **Configure Environment:**
    ```bash
    cp .env.example .env
    ```
    *Update `.env` with the URL and Anon Key from the Supabase start output.*

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## License

**AGPL-3.0 License**

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

*   **Free for Personal Use**: Run it on your own machine as much as you want.
*   **Open Source**: The code is transparent and available.
*   **Contribution**: If you modify it and run it as a service, you must share your improvements back with the community.

---

*Copyright (C) 2026 feldenserra*
