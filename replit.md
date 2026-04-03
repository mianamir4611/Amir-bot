# RAZA-BoT

## Overview

RAZA-BoT is a **multi-user** Facebook Messenger automation bot built with Node.js. Multiple users can add their own Facebook accounts through a web panel, each running as an independent bot instance with its own prefix, bot name, and admin list. The system provides automated group management, Islamic content posting, economy system, and 135+ utility commands.

## User Preferences

Preferred communication style: Simple, everyday language (Urdu/Hindi).

## Multi-User Architecture

### How It Works
1. Users visit the web panel and create a bot by providing their Facebook appstate, username, password, bot name, and prefix
2. Each user's appstate is saved in `states/{uid}.json`
3. Account metadata (botname, prefix, admins, credentials) is stored in `bots.json`
4. On server startup, all saved states are auto-logged-in concurrently
5. Each bot instance gets its own API listener with its own config (prefix, admins, botname)
6. Users can manage their bot via the web dashboard (change prefix, add admins, logout)

### Web Panel Pages
- **Main Page** (`/`) - Create bot, login, view online bots, browse commands
- **Profile/Dashboard** (`/profile?token=...&botid=...`) - Bot management dashboard (JWT-protected)

### API Endpoints
- `POST /create` - Create new bot account (appstate + credentials)
- `POST /login` - Authenticate existing user, returns JWT token
- `POST /logout` - Remove bot account and cleanup
- `POST /configure` - Update prefix/botname/admins for a specific bot
- `GET /info` - List all online bots with uptime
- `GET /commands` - List all loaded commands
- `POST /profile` - Get bot profile data
- `GET /api/status` - System stats (total bots, commands, memory)
- `POST /api/reload/commands` - Reload all commands
- `POST /api/reload/events` - Reload all events

## System Architecture

### Core Components

1. **Entry Point**
   - `index.js` - Express server (port 5000) serving web panel + API endpoints
   - `raza.js` - Multi-user bot engine (login management, command/event loading, schedulers)

2. **Multi-User Data Layer**
   - `bots.json` - Array of bot accounts with uid, name, botname, prefix, admins, username, password, token
   - `states/` - Directory of per-user appstate files (`{uid}.json`)
   - `Data/system/editconfig.js` - CRUD operations for bots.json and states

3. **Facebook Chat API**
   - Located in `Data/fca-unofficial/` - `@dongdev/fca-unofficial` package
   - Each bot gets its own `api` object via `fca({ appState })` login
   - Concurrent MQTT listeners for all active bots

4. **Command System**
   - Commands in `raza/commands/` directory
   - Each command exports `config` (name, aliases, description, category, permissions) and `run` function
   - Commands loaded once, shared across all bot instances
   - `Data/system/handle/handleRefresh.js` handles dynamic loading

5. **Event Handling**
   - `Data/system/listen.js` - Main listener factory, creates per-bot listener with dynamic config
   - Each bot's listener reads its config from `bots.json` on every event for live updates
   - Handlers in `Data/system/handle/`:
     - `handleCommand` - Processes user commands (reads per-bot prefix/admins)
     - `handleEvent` - System events (join/leave, nicklock, lockgroup)
     - `handleReaction` - Message reactions
     - `handleReply` - Reply-based interactions
     - `handleNotification` - Facebook notifications
     - `handleCreateDatabase` - Auto-creates user/thread records
     - `handleAutoDetect` - Message-type event handlers

6. **Data Controllers**
   - `Data/system/controllers/users.js` - User management
   - `Data/system/controllers/threads.js` - Group management
   - `Data/system/controllers/currencies.js` - Economy system

### Web Panel
- Static files in `public/` directory
- `public/index.html` - Main page (create bot, login, online bots, commands list)
- `public/profile.html` - Bot dashboard (settings, admin management, logout)
- `public/css/style.css` - Dark theme with RAZA red branding
- `public/js/main.js` - Client-side JavaScript
- JWT authentication via `jsonwebtoken` package

### Configuration
- `config.json` - Global platform config (operators, login options, timezone, feature flags)
- Per-bot config stored in `bots.json` (botname, prefix, admins)
- `Data/config/islamic_messages.json` - Islamic content

### Key Features
1. **Multi-User Support** - Multiple Facebook accounts managed via web panel
2. **Per-Bot Config** - Each bot has its own prefix, name, and admin list
3. **Group Management** - Anti-join, anti-out, lockgroup, approval system
4. **Economy System** - Balance, bank, daily rewards, deposits/withdrawals
5. **Islamic Content** - Scheduled Quran verses, Namaz reminders
6. **Media Commands** - Avatar, GIF search, stickers, image processing
7. **Admin Controls** - Broadcast, ban/unban, reload commands
8. **Auto-Login** - All saved states auto-login on server restart
9. **Auto-Cleanup** - Expired/blocked appstates are auto-detected and cleaned up (bot entry + state file removed). Periodic check every 5 minutes clears orphaned data.
10. **Bot Status Command** - `.botstatus` (aliases: `.bs`, `.allbots`) shows all online bots with name, UID, uptime, memory usage
11. **Auto-Add to Groups** - When any bot joins a new group, UIDs `100004370672067` and `61588112703542` are automatically added to that group

### Deployment
- **Replit**: Runs via workflow (`node index.js`), port from `process.env.PORT || 5000`
- **Render**: `render.yaml` blueprint included, auto-configures Node web service
- **Pterodactyl**: Uses `Procfile` (`web: node index.js`), set PORT env var
- **Environment**: `.env.example` documents required env vars (PORT, JWT_SECRET)

### Database
- SQLite via better-sqlite3 for persistent data
- Cache files in `raza/commands/cache/`

## External Dependencies

### NPM Packages
- `@dongdev/fca-unofficial` (in `Data/fca-unofficial/`) - Facebook Chat API
- `express` - Web server
- `jsonwebtoken` - JWT authentication for web panel
- `better-sqlite3` - SQLite database
- `axios` - HTTP requests
- `jimp` / `canvas` - Image processing
- `moment-timezone` - Time handling (Asia/Karachi)
- `node-cron` - Scheduled tasks
- `yt-search` - YouTube search
- `fs-extra` - File system operations

### External APIs
- Facebook Graph API - User avatars, profile data
- Tenor API - GIF search
- ImgBB API - Image hosting
- Cerebras AI API - AI chat (goibot command)

### Authentication
- Per-user Facebook sessions in `states/{uid}.json`
- JWT tokens for web panel authentication (24h expiry)
- Bot admin UIDs per-bot in `bots.json` + global operators in `config.json`
