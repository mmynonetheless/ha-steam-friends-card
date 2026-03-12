/**
 * Steam Friends Card for Home Assistant
 * Combines best features of kb-steam-card and steam-card-compact
 * Designed to work with sensor.steam_friends integration
 * Version 1.0.1
 */

class SteamFriendsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._friends = [];
    this._config = {};
    this._loading = true;
  }

  static getStubConfig() {
    return {
      entity: 'sensor.steam_friends',
      show_friends: true,
      group_by_status: true,
      online_only: false,
      game_background: false,
      compact_mode: true,
      custom_names: {},
      show_last_seen: true,
      title: 'Steam Friends'
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to specify an entity (e.g., sensor.steam_friends)');
    }
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._loading = false;
    const entityState = hass.states[this._config.entity];
    
    if (entityState && entityState.attributes && entityState.attributes.friends) {
      this._friends = entityState.attributes.friends;
      this._processFriends();
    } else if (entityState) {
      this._showError('No friend data available. Make sure your steam_friends integration has data.');
    } else {
      this._showError(`Entity "${this._config.entity}" not found. Make sure your steam_friends integration is installed and configured.`);
    }
  }

  _processFriends() {
    // Apply custom names with safety check
    if (this._config.custom_names && this._friends.length) {
      this._friends = this._friends.map(friend => {
        if (!friend || !friend.steamid) return friend;
        return {
          ...friend,
          personaname: this._config.custom_names[friend.steamid] || friend.personaname || 'Unknown'
        };
      }).filter(friend => friend && friend.steamid); // Remove any invalid entries
    }

    // Filter online only if configured
    if (this._config.online_only) {
      this._friends = this._friends.filter(f => f && f.personastate !== 0);
    }

    // Sort by status (playing > online > offline)
    this._friends.sort((a, b) => {
      const statusA = this._getStatusPriority(a);
      const statusB = this._getStatusPriority(b);
      return statusB - statusA;
    });

    this._render();
  }

  _getStatusPriority(friend) {
    if (!friend) return 0;
    if (friend.gameextrainfo) return 3;
    if (friend.personastate === 1) return 2;
    if (friend.personastate === 2) return 1;
    return 0;
  }

  _formatLastSeen(timestamp) {
    if (!timestamp) return '';
    const lastSeen = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeen.toLocaleDateString();
  }

  _getStatusText(state) {
    const states = {
      0: 'Offline',
      1: 'Online',
      2: 'Busy',
      3: 'Away',
      4: 'Snooze',
      5: 'Looking to Trade',
      6: 'Looking to Play'
    };
    return states[state] || 'Unknown';
  }

  _render() {
    if (!this.shadowRoot) return;

    const config = this._config;
    const grouped = { playing: [], online: [], offline: [] };

    // Only process if we have friends
    if (this._friends && this._friends.length) {
      this._friends.forEach(friend => {
        if (!friend) return;
        if (friend.gameextrainfo) grouped.playing.push(friend);
        else if (friend.personastate > 0) grouped.online.push(friend);
        else grouped.offline.push(friend);
      });
    }

    // Show loading state if no data yet
    if (this._loading) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 16px;
            background: var(--card-background-color, var(--ha-card-background, white));
            border-radius: var(--ha-card-border-radius, 12px);
            box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
            font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
          }
          .loading {
            text-align: center;
            color: var(--secondary-text-color);
            padding: 20px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 12px;
            border: 3px solid var(--divider-color, #e0e0e0);
            border-top-color: var(--primary-color, #03a9f4);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
        <div class="loading">
          <div class="spinner"></div>
          Loading Steam friends...
        </div>
      `;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
          background: var(--card-background-color, var(--ha-card-background, white));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }
        .header {
          font-size: 1.2rem;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--primary-text-color);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-icon {
          width: 24px;
          height: 24px;
        }
        .friends-grid {
          display: grid;
          grid-template-columns: ${config.compact_mode ? '1fr 1fr' : '1fr'};
          gap: 8px;
        }
        .group-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--secondary-text-color);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          grid-column: 1 / -1;
        }
        .friend-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--secondary-background-color, rgba(0,0,0,0.05));
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .friend-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          margin-right: 12px;
          border: 2px solid rgba(255,255,255,0.2);
          flex-shrink: 0;
          background: var(--divider-color, #e0e0e0);
        }
        .friend-info {
          flex: 1;
          min-width: 0;
        }
        .friend-name {
          font-weight: 600;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .friend-game {
          font-size: 0.8rem;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .friend-status {
          font-size: 0.75rem;
          opacity: 0.7;
        }
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-left: 8px;
          flex-shrink: 0;
        }
        .status-playing {
          background: #ff9800;
          box-shadow: 0 0 8px #ff9800;
        }
        .status-online {
          background: #4caf50;
        }
        .status-offline {
          background: #9e9e9e;
        }
        .last-seen {
          font-size: 0.7rem;
          opacity: 0.7;
          margin-top: 2px;
        }
        .error {
          color: #f44336;
          padding: 16px;
          text-align: center;
          background: rgba(244, 67, 54, 0.1);
          border-radius: 8px;
          margin: 8px 0;
        }
        .stats {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 0.8rem;
          color: var(--secondary-text-color);
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      </style>
      
      <div class="header">
        <svg class="header-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,4c4.41,0,8,3.59,8,8c0,4.41-3.59,8-8,8s-8-3.59-8-8C4,7.59,7.59,4,12,4z M7,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S7.55,13,7,13z M17,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S17.55,13,17,13z M16,8.5c0,0.55-0.45,1-1,1H9c-0.55,0-1-0.45-1-1s0.45-1,1-1h6C15.55,7.5,16,7.95,16,8.5z"/>
        </svg>
        ${config.title || 'Steam Friends'}
      </div>

      ${this._friends && this._friends.length > 0 ? `
        <div class="stats">
          <div class="stat-item">
            <span class="stat-dot status-playing"></span>
            <span>${grouped.playing.length} Playing</span>
          </div>
          <div class="stat-item">
            <span class="stat-dot status-online"></span>
            <span>${grouped.online.length} Online</span>
          </div>
          <div class="stat-item">
            <span class="stat-dot status-offline"></span>
            <span>${grouped.offline.length} Offline</span>
          </div>
        </div>
      ` : ''}

      ${!this._friends || this._friends.length === 0 ? 
        '<div class="error">No friends found or data unavailable</div>' :
        `<div class="friends-grid">
          ${config.group_by_status ? this._renderGrouped(grouped) : this._renderFlat()}
        </div>`
      }
    `;
  }

  _renderGrouped(grouped) {
    let html = '';
    
    if (grouped.playing.length) {
      html += `<div class="group-title">🎮 PLAYING (${grouped.playing.length})</div>`;
      grouped.playing.forEach(friend => {
        html += this._renderFriendItem(friend, 'playing');
      });
    }
    
    if (grouped.online.length) {
      html += `<div class="group-title">🟢 ONLINE (${grouped.online.length})</div>`;
      grouped.online.forEach(friend => {
        html += this._renderFriendItem(friend, 'online');
      });
    }
    
    if (grouped.offline.length && !this._config.online_only) {
      html += `<div class="group-title">⚫ OFFLINE (${grouped.offline.length})</div>`;
      grouped.offline.forEach(friend => {
        html += this._renderFriendItem(friend, 'offline');
      });
    }
    
    return html;
  }

  _renderFlat() {
    return this._friends.map(friend => {
      const status = friend.gameextrainfo ? 'playing' : 
                     friend.personastate > 0 ? 'online' : 'offline';
      return this._renderFriendItem(friend, status);
    }).join('');
  }

  _renderFriendItem(friend, status) {
    if (!friend || !friend.steamid) return '';
    
    const statusClass = status === 'playing' ? 'status-playing' : 
                        status === 'online' ? 'status-online' : 'status-offline';
    
    // Determine if we should show game background (with safety check for gameid)
    const showGameBg = this._config.game_background && 
                       status === 'playing' && 
                       friend.gameid && 
                       friend.gameid.toString().match(/^\d+$/); // Ensure it's a valid numeric ID
    
    const gameBgStyle = showGameBg ? 
      `background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), 
                        url('https://steamcdn-a.akamaihd.net/steam/apps/${friend.gameid}/header.jpg');
       background-size: cover;
       background-position: center;
       color: white;` : '';
    
    // Fallback avatar if none provided
    const avatarUrl = friend.avatar || 
                     'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg';
    
    return `
      <div class="friend-item" style="${gameBgStyle}">
        <img class="avatar" 
             src="${avatarUrl}" 
             alt="${friend.personaname || 'Friend'}'s avatar" 
             loading="lazy"
             onerror="this.src='https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg'">
        <div class="friend-info">
          <div class="friend-name">${friend.personaname || 'Unknown'}</div>
          ${friend.gameextrainfo ? 
            `<div class="friend-game">
              <span>🎮 ${friend.gameextrainfo}</span>
            </div>` : 
            status === 'offline' && this._config.show_last_seen && friend.lastlogoff ?
              `<div class="last-seen">Last seen ${this._formatLastSeen(friend.lastlogoff)}</div>` :
              `<div class="friend-status">${this._getStatusText(friend.personastate)}</div>`
          }
        </div>
        <div class="status-indicator ${statusClass}"></div>
      </div>
    `;
  }

  _showError(message) {
    if (!this.shadowRoot) return;
    this._loading = false;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 16px;
          background: var(--card-background-color, var(--ha-card-background, white));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }
        .error {
          color: #f44336;
          padding: 20px;
          text-align: center;
          background: rgba(244, 67, 54, 0.1);
          border-radius: 8px;
          margin: 8px 0;
        }
        .error-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .error-hint {
          font-size: 0.9rem;
          color: var(--secondary-text-color);
          margin-top: 12px;
        }
      </style>
      <div class="error">
        <div class="error-title">⚠️ Steam Friends Card Error</div>
        <div>${message}</div>
        <div class="error-hint">
          Make sure your <strong>${this._config.entity}</strong> sensor exists and has friend data.
        </div>
      </div>
    `;
  }

  getCardSize() {
    return Math.ceil((this._friends?.length || 0) / 2) + 2;
  }
}

customElements.define('steam-friends-card', SteamFriendsCard);

// Register with HACS custom card registry
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'steam-friends-card',
  name: 'Steam Friends Card',
  description: 'Display your Steam friends list from a single sensor',
  preview: true
});
