# 🎮 Steam Friends Card for Home Assistant

A fast custom Lovelace card that displays your Steam friends list using a **single sensor**. Built for performance and simplicity.

## ✨ Features

- 🎨 **Fully Theme Reactive** - Automatically adapts to your Home Assistant theme (light/dark mode, accent colors, etc.)
- ⚡ **Ultra-Fast Performance** - Optimized rendering handles hundreds of friends smoothly
- 🔑 **Single Sensor** - Works with `sensor.steam_friends` from [Steam Friends Integration](https://github.com/mmynonetheless/ha-steam-friends)
- 🎮 **Smart Grouping** - Automatically organizes friends by Playing, Online, and Offline status
- 🏷️ **Custom Names** - Rename friends with friendly nicknames
- ⏰ **Last Seen** - Shows when offline friends were last online
- 📱 **Compact Mode** - Two-column layout for efficient space use
- 🎯 **Powerful Whitelist Filtering** - Show EXACTLY the friends you want, hide the rest
- 🔄 **Auto-Refresh** - Updates automatically with your sensor data
- 🖱️ **Hover Effects** - Elegant animations that respect your theme

## 🎨 **Theme Integration**

The card automatically uses your Home Assistant themes:

| Element | Theme Variable | Fallback |
|---------|----------------|----------|
| Card Background | `--ha-card-background` | White |
| Primary Text | `--primary-text-color` | Black |
| Secondary Text | `--secondary-text-color` | Gray |
| Accent Color | `--primary-color` | Blue |
| Online Indicator | `--state-icon-color` | Green |
| Playing Indicator | `--state-icon-active-color` | Orange |
| Offline Indicator | `--disabled-text-color` | Gray |
| Dividers | `--divider-color` | Light Gray |
| Error Messages | `--error-color` | Red |
| Warnings | `--warning-color` | Orange |

This means the card will look perfect in **light mode, dark mode, or any custom theme** without any additional configuration!

## 📦 Installation

### HACS Installation (Recommended)

1. Make sure [HACS](https://hacs.xyz/) is installed
2. Go to **HACS → Frontend**
3. Click the three dots → **"Custom repositories"**
4. Add this repository: https://github.com/mmynonetheless/ha-steam-friends-card

text
Category: **"Lovelace"**
5. Click **"Explore & Download Repositories"**
6. Search for **"Steam Friends Card"** and download
7. **Refresh** your browser (hard refresh: Ctrl+F5 or Cmd+Shift+R)

### Manual Installation

1. Download `steam-friends-card.js` from the latest release
2. Place it in your `/config/www/` directory
3. Add to your Lovelace resources:
  - url: /local/steam-friends-card.js
    type: module


## ⚙️ Configuration

### Prerequisites

You need the [Steam Friends Integration](https://github.com/mmynonetheless/ha-steam-friends) installed and configured. This creates the `sensor.steam_friends` entity that the card uses.

### Basic Configuration


type: custom:steam-friends-card
entity: sensor.steam_friends


### Full Configuration Example

type: custom:steam-friends-card
entity: sensor.steam_friends
title: "My Gaming Squad"
group_by_status: true
compact_mode: true
online_only: false
show_last_seen: true
custom_names:
  "76561197960287930": "Best Friend"
  "76561197960497428": "Gaming Buddy"
include_friends:
  - "76561197960287930"
  - "Gaming Buddy"
  - "John"
exclude_friends:
  - "Spammer"
  - "76561197960642784"

## Filtering System

### include_friends - The Whitelist

When you specify include_friends, it acts as a strict whitelist. ONLY friends matching these criteria will be shown - everyone else is automatically hidden.


# This will show ONLY these three friends
include_friends:
  - "76561197960287930"           # By Steam ID
  - "John"                         # By name (case-insensitive)
  - "Gaming Buddy"                  # By custom name (if set)


### exclude_friends - The Blacklist

The blacklist removes specific friends from the whitelist results. Useful for fine-tuning.


include_friends:
  - "76561197960287930"
  - "76561197960497428"
  - "76561197960642784"

exclude_friends:
  - "76561197960497428"            # Remove this specific friend
  - "Annoying Person"                # Remove anyone with this in their name


### Filter Priority

1. Custom names are applied first - you can filter by custom names
2. Whitelist (include_friends) is applied - only matching friends remain
3. Blacklist (exclude_friends) is applied - removes specific friends
4. Online-only filter - optionally hides offline friends

## Understanding Status

| Status | Indicator | Description |
|--------|-----------|-------------|
| Playing | Orange dot | Friend is currently in-game (shows game name) |
| Online | Green dot | Friend is online but not playing |
| Offline | Gray dot | Friend is offline (shows last seen if enabled) |

## Example Configurations

### Simple Online-Only View

type: custom:steam-friends-card
entity: sensor.steam_friends
title: "Who's Online?"
online_only: true
compact_mode: true


### Full Featured with Custom Names

type: custom:steam-friends-card
entity: sensor.steam_friends
title: "Gaming Squad"
group_by_status: true
compact_mode: true
show_last_seen: true
custom_names:
  "76561197960287930": "GamerDad"
  "76561197960497428": "NoobSlayer"
include_friends:
  - "GamerDad"
  - "NoobSlayer"
  - "76561197960642784"


### Family & Close Friends

type: custom:steam-friends-card
entity: sensor.steam_friends
title: "Family & Close Friends"
include_friends:
  - "76561197960287930"
  - "76561197960497428"
  - "76561197960642784"
custom_names:
  "76561197960287930": "Dad"
  "76561197960497428": "Brother"
  "76561197960642784": "Cousin"

## Theme Integration

The card automatically uses your Home Assistant themes:

| Element | Theme Variable |
|---------|----------------|
| Card Background | --ha-card-background |
| Primary Text | --primary-text-color |
| Secondary Text | --secondary-text-color |
| Accent Color | --primary-color |
| Online Indicator | --state-icon-color |
| Playing Indicator | --state-icon-active-color |
| Offline Indicator | --disabled-text-color |
| Dividers | --divider-color |
| Error Messages | --error-color |
| Warnings | --warning-color |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Card shows "Entity not found" | Verify sensor.steam_friends exists in your system |
| No friends showing | Check that your Steam friends list isn't private |
| Custom names not working | Ensure Steam IDs are correct (64-bit format) |
| Filters not working | Remember: include_friends is a whitelist - ONLY those friends show |
| Card doesn't match theme | Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R) after theme changes |
| Friends not updating | Check your steam_friends integration update interval |

## Performance

This card is highly optimized for performance:
- O(1) Set-based filtering for lightning-fast whitelists
- Renders hundreds of friends smoothly
- Minimal memory footprint
- No unnecessary re-renders
- Efficient CSS with single-pass styling
- Lazy-loaded avatars

## Contributing

Contributions are welcome! Feel free to:
- Open an issue for bugs or suggestions
- Submit pull requests for improvements
- Star the repository if you find it useful

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Built for use with Steam Friends Integration
- Inspired by kb-steam-card and steam-card-compact
- Now with full Home Assistant theme support

## Contact

- GitHub: @mmynonetheless
- Issues: Open an issue on GitHub

---

*Now with automatic theme adaptation! Your card will always look perfect, no matter what theme you choose.*

## Remember: After Installation or Theme Changes

Hard refresh your browser! (Ctrl+F5 or Cmd+Shift+R)
```
