/**
 * Steam Friends Card for Home Assistant
 * Ultra-optimized with whitelist filtering
 * Now fully reactive to HA themes!
 * Version 1.4.0
 */

const C = {
  AVATAR: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg',
  STATUS: ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'Looking to Trade', 'Looking to Play'],
  ICON: 'M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10s10-4.48,10-10C22,6.48,17.52,2,12,2z M12,4c4.41,0,8,3.59,8,8c0,4.41-3.59,8-8,8s-8-3.59-8-8C4,7.59,7.59,4,12,4z M7,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S7.55,13,7,13z M17,13c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S17.55,13,17,13z M16,8.5c0,0.55-0.45,1-1,1H9c-0.55,0-1-0.45-1-1s0.45-1,1-1h6C15.55,7.5,16,7.95,16,8.5z'
};

class SteamFriendsCard extends HTMLElement {
  static getStubConfig() {
    return {
      entity: 'sensor.steam_friends',
      group_by_status: true,
      compact_mode: true,
      custom_names: {},
      show_last_seen: true,
      title: 'Steam Friends',
      include_friends: [], // Now a whitelist - ONLY these friends show
      exclude_friends: []  // Blacklist - removes from whitelist if needed
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._ = {
      f: [], // filtered friends
      c: {}, // config
      l: true, // loading
      e: null // error
    };
    this._render = this._render.bind(this);
  }

  setConfig(config) {
    if (!config?.entity) throw new Error('Entity required');
    this._.c = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass; // Store hass for theme access
    const s = hass?.states[this._.c.entity];
    if (!s) return this._setError(`Entity ${this._.c.entity} not found`);
    if (!s.attributes?.friends) return this._setError('No friend data');
    
    this._.l = false;
    this._.e = null;
    this._process(s.attributes.friends);
  }

  _setError(e) {
    this._.e = e;
    this._.l = false;
    this._render();
  }

  _process(friends) {
    let f = friends.filter(f => f?.steamid);
    
    // Apply custom names first (for filtering by custom names)
    const cn = this._.c.custom_names;
    if (cn) {
      f = f.map(f => {
        if (cn[f.steamid]) {
          return { ...f, personaname: cn[f.steamid] };
        }
        return f;
      });
    }
    
    // WHITELIST FILTER: If include_friends exists, ONLY show those friends
    const { include_friends = [], exclude_friends = [] } = this._.c;
    
    if (include_friends.length > 0) {
      // Create a Set for O(1) lookup performance
      const includeSet = new Set(include_friends.map(i => String(i).toLowerCase()));
      
      f = f.filter(friend => {
        const name = (friend.personaname || '').toLowerCase();
        const id = friend.steamid;
        
        // Check if friend matches ANY include criteria
        const isIncluded = [...includeSet].some(filter => {
          // Exact Steam ID match
          if (id === filter) return true;
          // Name contains filter (case-insensitive)
          if (name.includes(filter)) return true;
          return false;
        });
        
        return isIncluded;
      });
    }
    
    // Apply exclude filters (removes from whitelist results)
    if (exclude_friends.length > 0 && f.length > 0) {
      const excludeSet = new Set(exclude_friends.map(e => String(e).toLowerCase()));
      
      f = f.filter(friend => {
        const name = (friend.personaname || '').toLowerCase();
        const id = friend.steamid;
        
        // Check if friend matches ANY exclude criteria
        const isExcluded = [...excludeSet].some(filter => {
          if (id === filter) return true;
          if (name.includes(filter)) return true;
          return false;
        });
        
        return !isExcluded;
      });
    }
    
    // Online only filter
    if (this._.c.online_only) {
      f = f.filter(f => f.personastate !== 0);
    }
    
    // Sort by status (playing > online > offline)
    this._.f = f.sort((a, b) => {
      const pa = a.gameextrainfo ? 3 : a.personastate === 1 ? 2 : a.personastate === 2 ? 1 : 0;
      const pb = b.gameextrainfo ? 3 : b.personastate === 1 ? 2 : b.personastate === 2 ? 1 : 0;
      return pb - pa;
    });
    
    this._render();
  }

  _ls(t) {
    if (!t) return '';
    const d = (Date.now() - (t * 1000)) / 60000;
    if (d < 1) return 'Just now';
    if (d < 60) return `${Math.floor(d)}m ago`;
    if (d < 1440) return `${Math.floor(d/60)}h ago`;
    if (d < 10080) return `${Math.floor(d/1440)}d ago`;
    return new Date(t * 1000).toLocaleDateString();
  }

  _render() {
    if (!this.shadowRoot) return;
    const { c, l, e, f } = this._;
    
    if (l) return this.shadowRoot.innerHTML = S.loading;
    if (e) return this.shadowRoot.innerHTML = S.error(e, c.entity);
    if (!f.length) {
      // Show different message if filters are active vs no friends at all
      const hasFilters = c.include_friends?.length > 0 || c.exclude_friends?.length > 0;
      return this.shadowRoot.innerHTML = hasFilters ? S.noMatches : S.empty;
    }
    
    const groups = { p: [], o: [], f: [] };
    f.forEach(f => f.gameextrainfo ? groups.p.push(f) : f.personastate > 0 ? groups.o.push(f) : groups.f.push(f));
    
    this.shadowRoot.innerHTML = `
      <style>${S.style(c.compact_mode)}</style>
      <div class="c">
        ${S.header(c.title, c.include_friends?.length || c.exclude_friends?.length)}
        ${S.stats(groups)}
        <div class="g">${S.friends(groups, c)}</div>
      </div>
    `;
  }

  getCardSize() { return Math.ceil((this._.f?.length || 0) / 2) + 2; }
}

// Static styles (generated once) - Now with THEME VARIABLES!
const S = {
  style: compact => `
    :host {
      display: block;
      padding: 16px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      border-radius: var(--ha-card-border-radius, 12px);
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
      font-family: var(--primary-font-family, var(--paper-font-common-base_-_font-family, system-ui));
    }
    .c { width: 100%; }
    .h {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .i {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .fh {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      margin-left: 8px;
      padding: 2px 6px;
      background: var(--divider-color, rgba(0,0,0,0.05));
      border-radius: 4px;
    }
    .s {
      display: flex;
      gap: 16px;
      margin: 0 0 16px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      flex-wrap: wrap;
    }
    .si {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sd {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .sd.p {
      background: var(--state-icon-active-color, #ff9800);
      box-shadow: 0 0 8px var(--state-icon-active-color, #ff9800);
    }
    .sd.o {
      background: var(--state-icon-color, #4caf50);
    }
    .sd.f {
      background: var(--disabled-text-color, #9e9e9e);
    }
    .sc {
      font-weight: 600;
      color: var(--primary-text-color);
      margin-left: 2px;
    }
    .g {
      display: grid;
      grid-template-columns: ${compact ? '1fr 1fr' : '1fr'};
      gap: 8px;
    }
    .gt {
      grid-column: 1 / -1;
      margin: 8px 0 4px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .fi {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--secondary-background-color, rgba(0,0,0,0.05));
      transition: all 0.2s;
      cursor: pointer;
    }
    .fi:hover {
      transform: translateY(-2px);
      box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0,0,0,0.1));
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .fi:hover .fg,
    .fi:hover .fs,
    .fi:hover .fl {
      color: var(--text-primary-color, rgba(255,255,255,0.9));
    }
    .a {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      margin-right: 12px;
      border: 2px solid var(--divider-color, rgba(255,255,255,0.2));
      flex-shrink: 0;
      background: var(--disabled-text-color, #e0e0e0);
      object-fit: cover;
    }
    .f-info {
      flex: 1;
      min-width: 0;
    }
    .fn {
      font-weight: 600;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--primary-text-color);
    }
    .fi:hover .fn {
      color: var(--text-primary-color, #fff);
    }
    .fg {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--secondary-text-color);
    }
    .fs {
      font-size: 0.75rem;
      opacity: 0.7;
      color: var(--secondary-text-color);
    }
    .fl {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-top: 2px;
      color: var(--secondary-text-color);
    }
    .st {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-left: 8px;
      flex-shrink: 0;
    }
    .st.p {
      background: var(--state-icon-active-color, #ff9800);
      box-shadow: 0 0 8px var(--state-icon-active-color, #ff9800);
    }
    .st.o {
      background: var(--state-icon-color, #4caf50);
    }
    .st.f {
      background: var(--disabled-text-color, #9e9e9e);
    }
    .ld, .er {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .sp {
      width: 40px;
      height: 40px;
      margin: 0 auto 12px;
      border: 3px solid var(--divider-color, #e0e0e0);
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: s 1s linear infinite;
    }
    @keyframes s { to { transform: rotate(360deg); } }
    .er {
      color: var(--error-color, #f44336);
      background: var(--error-color, #f44336)1a;
      border-radius: 8px;
    }
    .nm {
      color: var(--warning-color, #ff9800);
      background: var(--warning-color, #ff9800)1a;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
  `,
  
  loading: `<style>:host{display:block;padding:16px}</style><div class="ld"><div class="sp"></div>Loading...</div>`,
  
  error: (msg, entity) => `<style>:host{display:block;padding:16px}</style><div class="er">⚠️ ${msg}<div style="font-size:.9rem;margin-top:8px;">Check <strong>${entity}</strong></div></div>`,
  
  empty: `<style>:host{display:block;padding:16px}</style><div class="er">No friends found</div>`,
  
  noMatches: `<style>:host{display:block;padding:16px}</style><div class="nm">No friends match your filter criteria</div>`,
  
  header: (title, filtered) => `
    <div class="h">
      <svg class="i" viewBox="0 0 24 24"><path fill="currentColor" d="${C.ICON}"/></svg>
      ${title || 'Steam Friends'}${filtered ? '<span class="fh">(filtered)</span>' : ''}
    </div>
  `,
  
  stats: g => g.p.length || g.o.length || g.f.length ? `
    <div class="s">
      <div class="si"><span class="sd p"></span>Playing <span class="sc">${g.p.length}</span></div>
      <div class="si"><span class="sd o"></span>Online <span class="sc">${g.o.length}</span></div>
      <div class="si"><span class="sd f"></span>Offline <span class="sc">${g.f.length}</span></div>
    </div>
  ` : '',
  
  friends: (g, c) => {
    if (!c.group_by_status) {
      return [...g.p, ...g.o, ...g.f].map(f => S.friend(f, f.gameextrainfo ? 'p' : f.personastate > 0 ? 'o' : 'f', c)).join('');
    }
    let html = '';
    if (g.p.length) html += `<div class="gt">🎮 PLAYING (${g.p.length})</div>${g.p.map(f => S.friend(f, 'p', c)).join('')}`;
    if (g.o.length) html += `<div class="gt">🟢 ONLINE (${g.o.length})</div>${g.o.map(f => S.friend(f, 'o', c)).join('')}`;
    if (g.f.length && !c.online_only) html += `<div class="gt">⚫ OFFLINE (${g.f.length})</div>${g.f.map(f => S.friend(f, 'f', c)).join('')}`;
    return html;
  },
  
  friend: (f, s, c) => {
    const ls = c.show_last_seen && f.lastlogoff ? new SteamFriendsCard()._ls(f.lastlogoff) : null;
    return `
      <div class="fi">
        <img class="a" src="${f.avatar || C.AVATAR}" alt="" loading="lazy" onerror="this.src='${C.AVATAR}'">
        <div class="f-info">
          <div class="fn">${f.personaname || 'Unknown'}</div>
          ${f.gameextrainfo ? `<div class="fg">🎮 ${f.gameextrainfo}</div>` : 
            ls ? `<div class="fl">Last seen ${ls}</div>` : 
            `<div class="fs">${C.STATUS[f.personastate] || 'Unknown'}</div>`}
        </div>
        <div class="st ${s}"></div>
      </div>
    `;
  }
};

customElements.define('steam-friends-card', SteamFriendsCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'steam-friends-card', name: 'Steam Friends Card', description: 'Display Steam friends from a single sensor', preview: true });
