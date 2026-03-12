/**
 * Steam Friends Card for Home Assistant
 * Ultra-optimized version with minimal overhead
 * Version 1.2.2
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
      title: 'Steam Friends'
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
    
    // Apply custom names (single pass)
    const cn = this._.c.custom_names;
    if (cn) f = f.map(f => cn[f.steamid] ? { ...f, personaname: cn[f.steamid] } : f);
    
    // Apply filters
    const { inc = [], exc = [] } = this._.c;
    if (inc.length || exc.length) {
      f = f.filter(f => {
        const n = f.personaname || '';
        const incOk = !inc.length || inc.some(i => this._match(f, i, n));
        const excOk = !exc.length || !exc.some(e => this._match(f, e, n));
        return incOk && excOk;
      });
    }
    
    // Online only
    if (this._.c.online_only) f = f.filter(f => f.personastate !== 0);
    
    // Sort by status (single pass)
    this._.f = f.sort((a, b) => {
      const pa = a.gameextrainfo ? 3 : a.personastate === 1 ? 2 : a.personastate === 2 ? 1 : 0;
      const pb = b.gameextrainfo ? 3 : b.personastate === 1 ? 2 : b.personastate === 2 ? 1 : 0;
      return pb - pa;
    });
    
    this._render();
  }

  _match(f, filter, name) {
    filter = String(filter).toLowerCase();
    return f.steamid === filter || 
           f.personaname?.toLowerCase().includes(filter) || 
           name.toLowerCase().includes(filter);
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
    if (!f.length) return this.shadowRoot.innerHTML = S.empty;
    
    const groups = { p: [], o: [], f: [] };
    f.forEach(f => f.gameextrainfo ? groups.p.push(f) : f.personastate > 0 ? groups.o.push(f) : groups.f.push(f));
    
    this.shadowRoot.innerHTML = `
      <style>${S.style(c.compact_mode)}</style>
      <div class="c">
        ${S.header(c.title, c.inc?.length || c.exc?.length)}
        ${S.stats(groups)}
        <div class="g">${S.friends(groups, c)}</div>
      </div>
    `;
  }

  getCardSize() { return Math.ceil((this._.f?.length || 0) / 2) + 2; }
}

// Static styles (generated once)
const S = {
  style: compact => `
    :host{display:block;padding:16px;background:var(--card-bg,var(--ha-card-bg,#fff));border-radius:var(--ha-card-radius,12px);box-shadow:var(--ha-card-shadow,0 2px 4px #0000001a);font-family:var(--primary-font, system-ui)}
    .c{width:100%}
    .h{display:flex;align-items:center;gap:8px;margin:0 0 16px;font-size:1.2rem;font-weight:500;color:var(--primary-text)}
    .i{width:24px;height:24px}
    .fh{font-size:.8rem;color:var(--secondary-text);margin-left:8px;padding:2px 6px;background:var(--secondary-bg,#00000008);border-radius:4px}
    .s{display:flex;gap:16px;margin:0 0 16px;padding:8px 0;border-bottom:1px solid var(--divider,#e0e0e0);font-size:.85rem;color:var(--secondary-text);flex-wrap:wrap}
    .si{display:flex;align-items:center;gap:6px}
    .sd{width:8px;height:8px;border-radius:50%}
    .sd.p{background:#ff9800;box-shadow:0 0 8px #ff9800}
    .sd.o{background:#4caf50}
    .sd.f{background:#9e9e9e}
    .sc{font-weight:600;color:var(--primary-text);margin-left:2px}
    .g{display:grid;grid-template-columns:${compact ? '1fr 1fr' : '1fr'};gap:8px}
    .gt{grid-column:1/-1;margin:8px 0 4px;font-size:.9rem;font-weight:500;color:var(--secondary-text);text-transform:uppercase;letter-spacing:.5px}
    .fi{display:flex;align-items:center;padding:8px 12px;border-radius:8px;background:var(--secondary-bg,#0000000d);transition:all .2s;cursor:pointer}
    .fi:hover{transform:translateY(-2px);box-shadow:0 4px 8px #0000001a;background:var(--primary-color,#03a9f4);color:#fff}
    .fi:hover .fg,.fi:hover .fs,.fi:hover .fl{color:#fffe}
    .a{width:36px;height:36px;border-radius:50%;margin-right:12px;border:2px solid #fff3;flex-shrink:0;background:var(--divider,#e0e0e0);object-fit:cover}
    .fi{flex:1;min-width:0}
    .fn{font-weight:600;font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .fg{display:flex;align-items:center;gap:4px;font-size:.8rem;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .fs{font-size:.75rem;opacity:.7}
    .fl{font-size:.7rem;opacity:.7;margin-top:2px}
    .st{width:10px;height:10px;border-radius:50%;margin-left:8px;flex-shrink:0}
    .st.p{background:#ff9800;box-shadow:0 0 8px #ff9800}
    .st.o{background:#4caf50}
    .st.f{background:#9e9e9e}
    .ld,.er{padding:20px;text-align:center;color:var(--secondary-text)}
    .sp{width:40px;height:40px;margin:0 auto 12px;border:3px solid var(--divider,#e0e0e0);border-top-color:var(--primary-color,#03a9f4);border-radius:50%;animation:s 1s linear infinite}
    @keyframes s{to{transform:rotate(360deg)}}
    .er{color:#f44336;background:#f443361a;border-radius:8px}
  `,
  
  loading: `<style>:host{display:block;padding:16px}</style><div class="ld"><div class="sp"></div>Loading...</div>`,
  
  error: (msg, entity) => `<style>:host{display:block;padding:16px}</style><div class="er">⚠️ ${msg}<div style="font-size:.9rem;margin-top:8px;">Check <strong>${entity}</strong></div></div>`,
  
  empty: `<style>:host{display:block;padding:16px}</style><div class="er">No friends match filters</div>`,
  
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
