# MahjRank iOS App — Setup Guide

## Prerequisites
- macOS with Xcode 15+ installed
- Apple Developer account (enrolled)
- Node.js 18+
- CocoaPods (`sudo gem install cocoapods`)

## Step 1: Install dependencies

```bash
cd monmouth-made-mah-jongg
npm install
```

This installs Capacitor core, CLI, iOS platform, and all native plugins
(push notifications, haptics, status bar, splash screen).

## Step 2: Build the web app and initialize iOS

```bash
npm run build          # Creates dist/ with your React app
npx cap add ios        # Creates the ios/ folder with Xcode project
npx cap sync ios       # Copies dist/ into the native project + installs pods
```

Or use the shortcut:
```bash
npm run cap:build      # build + sync in one command
```

## Step 3: Open in Xcode

```bash
npx cap open ios
```

This opens the `.xcworkspace` in Xcode.

## Step 4: Configure in Xcode

### Signing & Team
1. Select the **App** target in the project navigator
2. Go to **Signing & Capabilities**
3. Select your Apple Developer team
4. Bundle ID should already be: `com.mahjrank.app`
5. Xcode will create the provisioning profile automatically

### Push Notifications capability
1. Still in **Signing & Capabilities**, click **+ Capability**
2. Add **Push Notifications**
3. Add **Background Modes** → check **Remote notifications**

### App Icons
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace with your MahjRank icons (1024x1024 required for App Store)
3. Use a tool like https://appicon.co to generate all sizes from your 1024px icon

### Splash Screen
1. Open `ios/App/App/Assets.xcassets/Splash.imageset`
2. Replace with your MahjRank splash image
3. The background color is configured in `capacitor.config.ts` as `#0F172A`

### Display Name
The app name "MahjRank" is set in `capacitor.config.ts`. To change the display
name under the icon, edit `ios/App/App/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>MahjRank</string>
```

## Step 5: Test on device

1. Connect your iPhone via USB
2. Select your device in the Xcode toolbar
3. Hit **Run** (⌘R)
4. First time: trust the developer certificate on your phone
   (Settings → General → VPN & Device Management)

## Step 6: Push Notification Server Setup

The app registers for APNs and stores the device token in the `push_token`
column on the `players` table. To send push notifications:

1. Create an **APNs Key** in your Apple Developer account:
   - Go to Certificates, Identifiers & Profiles → Keys
   - Create a key with Apple Push Notifications service (APNs)
   - Download the .p8 file — you'll need it for your server

2. Add a `push_token` column to your Supabase `players` table:
   ```sql
   ALTER TABLE players ADD COLUMN push_token TEXT;
   ```

3. Send pushes from a Supabase Edge Function or your backend using the APNs
   HTTP/2 API or a library like `apn` or `node-apn`.

## Step 7: Submit to App Store

1. In Xcode: **Product → Archive**
2. In the Organizer window, click **Distribute App**
3. Choose **App Store Connect** → **Upload**
4. Go to [App Store Connect](https://appstoreconnect.apple.com)
5. Create a new app with bundle ID `com.mahjrank.app`
6. Fill in metadata:
   - App name: MahjRank
   - Subtitle: Competitive Mahjong Ratings
   - Category: Games → Board
   - Secondary: Sports
   - Screenshots: 6.7" (iPhone 15 Pro Max) and 6.1" (iPhone 15 Pro)
7. Submit for review

## Development Workflow

After making changes to React code:
```bash
npm run cap:build     # Rebuilds web + syncs to iOS
```

For live reload during development:
1. Find your Mac's local IP (e.g., `192.168.1.100`)
2. In `capacitor.config.ts`, uncomment and set:
   ```ts
   url: 'http://192.168.1.100:5173',
   ```
3. Run `npm run dev` and `npx cap open ios`
4. The app on your phone will live-reload from your dev server
5. **Remember to comment out the URL before building for production!**

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run cap:build` | Build web app + sync to iOS |
| `npm run cap:dev` | Build + sync + open Xcode |
| `npm run cap:open` | Open Xcode |
| `npm run cap:sync` | Sync web assets to iOS (no rebuild) |

## File Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift     # iOS app lifecycle
│   │   ├── Info.plist             # App configuration
│   │   └── Assets.xcassets/       # Icons & splash
│   ├── App.xcodeproj
│   └── Podfile                    # CocoaPods dependencies
capacitor.config.ts                # Capacitor settings
src/native.js                      # Native bridge (haptics, push, status bar)
```
