# Vertigo AI Premium Investment Intelligence Terminal MVP

Vertigo is a premium AI-powered financial intelligence terminal. It balances the data density of a modernized Bloomberg Terminal with the effortless glassmorphic aesthetic of high-end consumer electronics.

This repository contains a professional, high-fidelity MVP modularly refactored for clean organization and ease of maintainability.

---

## 📂 Codebase Folder Structure

The code is split into logical modules:

```text
c:/Users/swapn/OneDrive/Desktop/vertigo-ai/
├── index.html                   # HTML structure layouts and template containers
├── README.md                    # Running instructions & architectural layout
├── src/
│   ├── css/
│   │   └── styles.css           # Custom glassmorphic styles and keyframe animations
│   └── js/
│       ├── state.js             # Global state (mock asset metrics, user session data, toasts, auditLog)
│       ├── router.js            # Hash-based client-side routing & page viewport toggler
│       ├── auth.js              # Identity logins, signups, password recoveries, logouts
│       ├── dashboard.js         # Daily briefs indicators, trending asset list loading
│       ├── markets.js           # Markets lists table, sectors & query filters
│       ├── stockDetails.js      # Dynamic stock graphs SVGs, news vectors, watchlist tags
│       ├── portfolio.js         # Strategy holdings table, rebalancer sliders optimizer
│       ├── watchlist.js         # Watch target cards, Sparkline SVGs, target inputs
│       ├── aiAssistant.js       # Copilot chatbot conversation panels & neural answers
│       ├── scanner.js           # Breakouts ranking table, scan loaders & progress bars
│       ├── compare.js           # Asset benchmarks grid, list modifiers
│       ├── reports.js           # Dossiers compilations tables & progress meters
│       ├── alerts.js            # Watchdog timeline CRUD & alarm creation modal
│       ├── settings.js          # Profiles settings, API credential key creation
│       └── app.js               # Event listeners startup bootstrap & global header searches
```

---

## 🌟 Visual & Design System

The visual language follows the system outlined in [DESIGN.md](file:///c:/Users/swapn/OneDrive/Desktop/vertigo-ai/DESIGN.md):
- **Base Backdrop:** Deep Obsidian (`#051424`).
- **Accent Details:** Midnight Cobalt (`#1415a8` / `#bfc2ff`) and Neon Emerald (`#1fca17` / `#77ff61`).
- **Aesthetic Core:** Glassmorphism, high contrast density, custom typography (Raleway, Inter, and JetBrains Mono), and top-down inner card borders mimicking natural lighting.

---

## 🚀 Running the Terminal

Because the code is split into modular JavaScript files, modern web browsers may impose security blocks (CORS) when loading scripts directly from the local file system (`file:///`).

To run the terminal correctly, please use a local web server:

1.  **Launch Server:**
    Run one of the following commands in the project folder:
    ```powershell
    python -m http.server 8000
    ```
    or
    ```powershell
    npx serve .
    ```
2.  **Access App:**
    Open your browser and navigate to:
    `http://localhost:8000/index.html` or `http://localhost:3000/` (depending on the server port).
