# Steam Friends Card for Home Assistant

[![HACS Custom][hacs-shield]][hacs]
[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE)

A custom Lovelace card for Home Assistant that displays your Steam friends list using a **single sensor** from the [Steam Friends Integration](https://github.com/mmynonetheless/ha-steam-friends).

![Steam Friends Card Preview](https://via.placeholder.com/800x400?text=Steam+Friends+Card+Preview)

## ✨ Features

- 🔑 **Single Sensor** - Works with `sensor.steam_friends` from your integration
- 👥 **Complete Friends List** - Shows all friends with their current status
- 🎮 **Game Detection** - See what game each friend is playing
- 📊 **Smart Grouping** - Automatically groups friends by status (Playing, Online, Offline) [citation:1]
- 🏷️ **Custom Names** - Override Steam usernames with friendly names [citation:1]
- ⏰ **Last Seen** - Shows when offline friends were last online [citation:1][citation:3]
- 📱 **Compact Mode** - Two-column layout for space efficiency [citation:3]
- 🖼️ **Game Backgrounds** - Optional game artwork as background [citation:2]
- 🔄 **Auto-updates** - Refreshes when your sensor updates

## 📦 Installation

### HACS Installation (Recommended)

1. Make sure [HACS](https://hacs.xyz/) is installed
2. Go to HACS → Frontend
3. Click the three dots → "Custom repositories"
4. Add this repository URL with category "Lovelace":
https://github.com/mmynonetheless/ha-steam-friends-card

text
5. Click "Explore & Download Repositories"
6. Search for "Steam Friends Card" and download
7. Refresh your browser

### Manual Installation

1. Download `steam-friends-card.js` from the latest release
2. Place it in your `config/www/` directory
3. Add to your Lovelace resources:
```yaml
resources:
  - url: /local/steam-friends-card.js
    type: module
