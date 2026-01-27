# HomeCoreOS
**[homecoreos.net](https://homecoreos.net)**

## Finding Balance in the Chaos

There is an constant weight to every day life . From the moment we wake up, we have tasks and issues piled on top . Finding some degree of balance is required .

I built **HomeCoreOS** because I needed to bring some degree of rhyme and rhythm to that chaos. It is the system I personally use myself .

...something something...atomic habits...something something...fall to your systems...

### The All-In-One Operating System for Your Life
HomeCoreOS is designed to be the single source of truth .
I've included the things I am personally 'worried' about in life . 
A better way to say this would be :
I've included the things I care about in life .

### Features
*   **✅ Task Management**: Organize, categorize, and track to-dos with a quick, easy interface .
*   **🏆 Wall of Achievements**: A cool place to celebrate .
*   **📝 Daily Notes**: Capture your thoughts, clear your mind, and keep a log of your days .
*   **🍳 Recipe Organizer**: Save recipes, calculate macros, and manage your kitchen .
*   **📅 Meal Scheduler**: Generate random 7 or 14-day meal plans . ** {Coming Soon} -- Auto Macros, Grocery List, External App Syncs **
*   **🔐 Private & Secure**: Your data is yours . Protected by enterprise-grade security .

---

### Getting Started
This project is **"Semi Open Source" (Fair Code)**. You are free to download and run this code locally **for free** for personal use.

#### Prerequisites
1.  **Node.js** (v18+)
2.  **Supabase CLI** (for local database)
3.  **Docker** (required by Supabase)

#### Installation
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

---

### License
**AGPL-3.0 License**

*   **Free for Personal Use**: Run it on your own machine as much as you want.
*   **Open Source**: The code is transparent and available.
*   **Contribution**: If you modify it and run it as a service, you must share your improvements back with the community.

*Copyright (C) 2026 feldenserra*
