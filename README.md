# 🎮 Steam Friends Card for Home Assistant

A fast custom Lovelace card that displays your Steam friends list using a **single sensor**. Built for performance and simplicity.

## ✨ Features

- ⚡ **Ultra-Fast Performance** - Optimized rendering handles hundreds of friends smoothly
- 🔑 **Single Sensor** - Works with `sensor.steam_friends` from [Steam Friends Integration](https://github.com/mmynonetheless/ha-steam-friends)
- 🎮 **Smart Grouping** - Automatically organizes friends by Playing, Online, and Offline status
- 🏷️ **Custom Names** - Rename friends with friendly nicknames
- ⏰ **Last Seen** - Shows when offline friends were last online
- 📱 **Compact Mode** - Two-column layout for efficient space use
- 🎯 **Powerful Whitelist Filtering** - Show EXACTLY the friends you want, hide the rest
- 🔄 **Auto-Refresh** - Updates automatically with your sensor data
- 🎨 **Clean Design** - Modern UI with smooth hover effects

## 📦 Installation

### HACS Installation (Recommended)

1. Make sure [HACS](https://hacs.xyz/) is installed
2. Go to **HACS → Frontend**
3. Click the three dots → **"Custom repositories"**
4. Add this repository:
https://github.com/mmynonetheless/ha-steam-friends-card

text
Category: **"Lovelace"**
5. Click **"Explore & Download Repositories"**
6. Search for **"Steam Friends Card"** and download
7. **Refresh** your browser

### Manual Installation

1. Download `steam-friends-card.js` from the latest release
2. Place it in your `config/www/` directory
3. Add to your Lovelace resources:
```yaml
resources:
  - url: /local/steam-friends-card.js
    type: module
