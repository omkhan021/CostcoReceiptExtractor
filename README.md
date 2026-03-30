# Costco Receipt Extracter

A personal React Native app that syncs your Costco warehouse purchase history to your device and lets you search across all your receipts. Find any item you've ever bought at Costco — which trip, which warehouse, how much you paid.

---

## Features

- **WebView login** — authenticate through Costco's own login page; no credentials are ever handled by this app directly
- **Full sync** — fetches up to 2 years of in-store receipt history from Costco's API in rolling 6-month windows
- **Incremental sync** — subsequent syncs only fetch receipts newer than the last run
- **Fuzzy search** — find items by partial or misspelled name using Fuse.js
- **Local-first** — all data is stored in an encrypted SQLite database on device; nothing is sent to any third-party server
- **Receipt detail** — view full itemized receipt including tender, taxes, and savings

---

## How It Works

1. You log in to Costco via an embedded WebView. The app injects JavaScript that intercepts the bearer token Costco's own frontend uses and captures it securely.
2. That token is stored in the device's encrypted keychain/keystore via `react-native-encrypted-storage`.
3. On sync, the app calls Costco's GraphQL API (`ecom-api.costco.com`) to fetch receipt summaries for each date window, then fetches full item details for any receipt not already in the local database.
4. Receipts and items are stored in SQLite via `@op-engineering/op-sqlite`.
5. Search queries run against a Fuse.js index built from all item names in the database.

> **Note:** The bearer token Costco issues expires after ~15 minutes. If sync fails with an auth error, open the app's login screen to capture a fresh token.

---

## Prerequisites

You need the standard React Native CLI environment set up. Follow the **React Native CLI Quickstart** for your OS and target platform:

https://reactnative.dev/docs/set-up-your-environment

### Required tools

| Tool | Version | Notes |
|---|---|---|
| Node.js | >= 22.11.0 | Use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| npm | bundled with Node | |
| JDK | 17 (recommended) | Required for Android builds |
| Android Studio | Latest stable | For Android SDK, emulator, and build tools |
| Xcode | 15+ | macOS only — required for iOS builds |
| CocoaPods | Latest | macOS only — `sudo gem install cocoapods` |

### Android SDK (via Android Studio)

In Android Studio → SDK Manager, ensure the following are installed:

- Android SDK Platform 35
- Android SDK Build-Tools 35
- Android Emulator
- Android SDK Platform-Tools

Set these environment variables (add to `~/.bashrc`, `~/.zshrc`, or Windows System Environment Variables):

**macOS / Linux:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk      # macOS
# export ANDROID_HOME=$HOME/Android/Sdk            # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows:**
```
ANDROID_HOME = C:\Users\<YourUser>\AppData\Local\Android\Sdk
Add to PATH:   %ANDROID_HOME%\platform-tools
               %ANDROID_HOME%\emulator
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd CostcoReceiptExtracter
```

### 2. Install JavaScript dependencies

```bash
npm install
```

### 3. iOS only — install CocoaPods

```bash
cd ios
pod install
cd ..
```

This must be re-run any time a new native dependency is added.

---

## Opening in VS Code

### Recommended extensions

Install these from the Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`):

| Extension | Publisher ID |
|---|---|
| ESLint | `dbaeumer.vscode-eslint` |
| Prettier | `esbenp.prettier-vscode` |
| React Native Tools | `msjsdiag.vscode-react-native` |
| TypeScript (built-in) | ships with VS Code |

### Workspace settings

To enable format-on-save, create `.vscode/settings.json` at the project root:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### Open the project

```bash
code .
```

Or: **File → Open Folder** → select the `CostcoReceiptExtracter` directory.

TypeScript IntelliSense works out of the box — the project includes `tsconfig.json` and all type definitions.

---

## Running the App

### Step 1 — Start Metro

Metro is the JavaScript bundler for React Native. It must be running before you launch on any device or emulator. Open a terminal in the project root:

```bash
npm start
```

Leave this terminal running. Open a **second terminal** for the platform commands below.

---

### Android

#### Option A — Physical device

1. On your Android phone, go to **Settings → About Phone** and tap **Build Number** 7 times to unlock Developer Options.
2. Go to **Settings → Developer Options** and enable **USB Debugging**.
3. Connect the phone to your computer via USB and accept the prompt on the phone.
4. Verify the device is recognized:
   ```bash
   adb devices
   ```
   You should see your device listed with status `device`.
5. Run the app:
   ```bash
   npm run android
   ```

#### Option B — Emulator

1. Open **Android Studio → Device Manager** (the phone icon in the top toolbar).
2. Click **Create Device** → choose a phone (e.g., Pixel 8) → select API 35 system image → Finish.
3. Start the emulator by clicking the play button next to the device.
4. Once the emulator is fully booted, run:
   ```bash
   npm run android
   ```

#### Troubleshooting Android

```bash
# Stale Gradle cache
cd android && ./gradlew clean && cd ..
npm run android

# Reset Metro bundler cache
npm start -- --reset-cache

# Check connected devices
adb devices

# Kill and restart ADB if device not detected
adb kill-server && adb start-server
```

---

### iOS (macOS only)

#### Option A — Simulator

```bash
npm run ios
```

This defaults to the most recently used simulator. To target a specific one:

```bash
npx react-native run-ios --simulator "iPhone 15 Pro"
```

List all available simulators:
```bash
xcrun simctl list devices available
```

#### Option B — Physical device

1. Open `ios/CostcoReceiptExtracter.xcworkspace` in Xcode. **Use the `.xcworkspace` file, not `.xcodeproj`.**
2. In the toolbar, select your physical device from the target dropdown.
3. Go to **Signing & Capabilities → Team** and select your Apple ID.
4. Click **Run** (▶).

#### Troubleshooting iOS

```bash
# Clean Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Re-install pods from scratch
cd ios && pod deintegrate && pod install && cd ..

# Reset Metro cache
npm start -- --reset-cache
```

If you get a "trust this developer" prompt on your iPhone, go to **Settings → General → VPN & Device Management** and trust your developer certificate.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Metro bundler |
| `npm run android` | Build and run on Android device/emulator |
| `npm run ios` | Build and run on iOS simulator |
| `npm run lint` | Run ESLint across all source files |
| `npm test` | Run Jest tests |

---

## Project Structure

```
src/
├── api/
│   ├── authService.ts          WebView JS injection + credential parsing
│   ├── costcoClient.ts         Axios GraphQL client for Costco's API
│   └── receiptParser.ts        Maps raw API response to DB schema types
├── components/
│   ├── ItemResultRow.tsx        Search result row (item name + receipt count)
│   ├── ReceiptItemRow.tsx       Line item within a receipt detail view
│   ├── ReceiptRow.tsx           Receipt summary row (date, warehouse, total)
│   └── SearchBar.tsx            Debounced text input
├── db/
│   ├── database.ts              SQLite init + migration runner
│   ├── configRepository.ts      Key-value config (last sync cursor, etc.)
│   ├── receiptRepository.ts     Receipt + item CRUD operations
│   └── migrations/
│       └── 001_initial.ts       Schema: receipts, receipt_items, sync_log, app_config
├── hooks/
│   ├── useReceipts.ts           Receipt list state
│   ├── useSearch.ts             Debounced search with Fuse.js
│   └── useSync.ts               Sync orchestration + progress state
├── navigation/
│   ├── RootNavigator.tsx        Auth gate: shows AuthStack or AppStack
│   ├── AppStack.tsx             Bottom tabs: Search + Receipts
│   ├── AuthStack.tsx            Login flow
│   └── types.ts                 Navigation param types
├── screens/
│   ├── HomeScreen.tsx           Fuzzy item search UI
│   ├── LoginScreen.tsx          WebView-based Costco login
│   ├── ReceiptDetailScreen.tsx  Full receipt with line items
│   └── SyncScreen.tsx           Receipt list + sync controls
├── search/
│   ├── fuseIndex.ts             Fuse.js index lifecycle
│   └── searchService.ts         Search query wrapper
├── store/
│   └── authStore.ts             Zustand: credentials + auth state
├── sync/
│   └── syncEngine.ts            Windowed fetch, deduplication, DB insert
├── types.ts                     Shared TypeScript interfaces
└── utils/
    ├── constants.ts             API URLs, header names, tuning params
    └── dateUtils.ts             Date helpers (ISO, Costco M/DD/YYYY format)
```

---

## Architecture Notes

### Authentication

The app does not implement its own login form. It loads Costco's actual login page in a `WebView` and injects JavaScript that patches `XMLHttpRequest` and `fetch` to watch outgoing headers. When Costco's frontend makes its first authenticated API call after login, the injection captures:

- `costco-x-authorization` — the bearer JWT (expires ~15 min after issue)
- `client-identifier` — a per-session UUID

These are posted back to React Native via `postMessage`, then persisted in the device keychain/keystore via `react-native-encrypted-storage`. The static `costco-x-wcs-clientId` header is hardcoded since it is the same for all Costco web clients.

### Sync windows

Costco's GraphQL API (`receiptsWithCounts`) accepts date-range queries in `M/DD/YYYY` format. The sync engine breaks the full 2-year lookback into 6-month windows and fetches each one sequentially. A `last_sync_cursor` stored in the `app_config` table means subsequent syncs only request receipts from the last sync date forward.

### Search

Fuse.js builds an in-memory fuzzy index from all item names in the database on app load (and after each sync). Searches are debounced at 250ms. Results are grouped by item name and show every receipt the item appeared in, sorted by most recent purchase date.

### Database

SQLite via `@op-engineering/op-sqlite` — a JSI-based binding with no bridge overhead. Schema migrations are versioned sequentially in `src/db/migrations/` and applied automatically on startup.

---

## Known Limitations

- **Token expiry** — the bearer token expires in ~15 minutes. If a sync fails mid-run, re-open the login screen to capture a fresh token. There is currently no automatic token refresh.
- **iOS requires a Mac** — React Native iOS builds cannot be produced on Windows.
- **Warehouse receipts only** — the sync uses `documentType: "all"` which covers in-warehouse, gas station, car wash, and gas+car wash receipts. Costco.com online/delivery orders use a different API and are not included.
- **No background sync** — sync must be triggered manually from the Receipts tab.
