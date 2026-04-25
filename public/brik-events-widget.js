/**
 * Brik DevBar — Events slot
 *
 * Subscribes to the @brikdesigns/events MemoryTransport buffer (exposed on
 * window.__brikEventsMemory) and renders a live-tail panel of the most
 * recent events firing on the page. Use cases:
 *   - Devs verify their new `analytics.track(...)` actually fires
 *   - QA confirms the right events emit at the right moment
 *   - Agents grab a JSON dump of events to paste into prompts
 *
 * If MemoryTransport isn't initialized (SDK not loaded on this page), the
 * slot still registers but shows a helpful "no events yet" placeholder.
 * Polls every 500ms for a late-arriving MemoryTransport.
 *
 * Registers as slot id "events" (order 40 — after inspect, before any
 * future tools).
 */

(function () {
  'use strict';

  // Re-entry guard
  if (window.__brikEventsWidgetInitialized) return;
  window.__brikEventsWidgetInitialized = true;

  // Shared BDS tokens (mirror of the T block in sibling widgets).
  const T = {
    poppy: '#e35335',
    poppyDark: '#b0351b',
    white: '#ffffff',
    tanLightest: '#f1f0ec',
    grayLighter: '#e0e0e0',
    grayLight: '#bdbdbd',
    grayDark: '#828282',
    grayDarker: '#4f4f4f',
    grayDarkest: '#333333',
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontFamilyMono:
      "'JetBrains Mono', ui-monospace, SF Mono, Menlo, Consolas, monospace",
  };

  const css = `
    .bev-panel {
      position: fixed; bottom: 72px; left: 50%;
      transform: translateX(-50%);
      width: 480px; max-width: calc(100vw - 32px);
      max-height: min(60vh, 560px);
      z-index: 2147483644;
      background: ${T.white};
      color: ${T.grayDarkest};
      border: 1px solid ${T.grayLighter};
      border-radius: 12px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18);
      font-family: ${T.fontFamily};
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .bev-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid ${T.grayLighter};
      gap: 8px;
    }
    .bev-title {
      font-size: 11px;
      font-weight: 700;
      color: ${T.grayDark};
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .bev-count {
      display: inline-flex; align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      background: ${T.poppy};
      color: ${T.white};
      font-family: ${T.fontFamily};
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .bev-actions {
      display: inline-flex; gap: 6px;
    }
    .bev-action-btn {
      background: transparent;
      color: ${T.grayDarker};
      border: 1px solid ${T.grayLighter};
      border-radius: 999px;
      padding: 4px 10px;
      font-family: ${T.fontFamily};
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
    }
    .bev-action-btn:hover {
      background: ${T.poppy};
      color: ${T.white};
      border-color: ${T.poppy};
    }

    .bev-list {
      overflow-y: auto;
      padding: 4px 0;
      background: ${T.tanLightest};
    }
    .bev-empty {
      padding: 32px 16px;
      text-align: center;
      color: ${T.grayDark};
      font-size: 12px;
      font-family: ${T.fontFamily};
    }
    .bev-empty code {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 8px;
      background: ${T.white};
      border: 1px solid ${T.grayLighter};
      border-radius: 4px;
      font-family: ${T.fontFamilyMono};
      font-size: 11px;
      color: ${T.poppyDark};
    }

    .bev-row {
      padding: 8px 14px;
      border-bottom: 1px solid ${T.grayLighter};
      font-family: ${T.fontFamilyMono};
      font-size: 11px;
      line-height: 1.5;
      background: ${T.white};
      transition: background 0.12s ease;
    }
    .bev-row:hover { background: ${T.tanLightest}; }
    .bev-row__top {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 8px;
    }
    .bev-row__name {
      color: ${T.poppyDark};
      font-weight: 600;
      word-break: break-all;
    }
    .bev-row__time {
      color: ${T.grayDark};
      font-size: 10px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .bev-row__props {
      color: ${T.grayDarker};
      margin-top: 4px;
      word-break: break-word;
    }
    .bev-row__meta {
      color: ${T.grayDark};
      font-size: 10px;
      margin-top: 2px;
    }
  `;

  function injectStyles() {
    if (document.querySelector('style[data-brik-events]')) return;
    const s = document.createElement('style');
    s.setAttribute('data-brik-events', '');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>';
  }

  let panelEl = null;
  let listEl = null;
  let countEl = null;
  let isOpen = false;
  let unsubscribe = null;
  let memory = null;
  let memoryCheckIv = null;

  // Count of new events since panel was last opened. Feeds the slot badge.
  let unreadCount = 0;

  function resolveMemory() {
    if (memory) return memory;
    const m = window.__brikEventsMemory;
    if (m && typeof m.subscribe === 'function') {
      memory = m;
      return m;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
    );
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }

  function formatProps(props) {
    if (!props || Object.keys(props).length === 0) return '';
    try {
      return JSON.stringify(props);
    } catch {
      return '[unserializable]';
    }
  }

  function renderList() {
    if (!listEl) return;
    const m = resolveMemory();
    if (!m) {
      listEl.innerHTML = `
        <div class="bev-empty">
          @brikdesigns/events not detected on this page.
          <br><br>
          Once your app calls <code>createAnalytics({ transports: [new MemoryTransport()] })</code>,
          events will appear here live.
        </div>
      `;
      if (countEl) countEl.textContent = '0';
      return;
    }
    const events = m.getEvents();
    if (events.length === 0) {
      listEl.innerHTML = `<div class="bev-empty">No events yet. Call <code>analytics.track(...)</code> to see them here.</div>`;
    } else {
      // Newest first
      listEl.innerHTML = events
        .slice()
        .reverse()
        .map((ev) => `
          <div class="bev-row">
            <div class="bev-row__top">
              <span class="bev-row__name">${escapeHtml(ev.name)}</span>
              <span class="bev-row__time">${escapeHtml(formatTime(ev.timestamp))}</span>
            </div>
            ${ev.properties && Object.keys(ev.properties).length
                ? `<div class="bev-row__props">${escapeHtml(formatProps(ev.properties))}</div>`
                : ''}
            <div class="bev-row__meta">${escapeHtml(ev.surface)} · ${escapeHtml((ev.distinct_id || '').slice(0, 18))}${ev.user_id ? ' · user:' + escapeHtml(ev.user_id.slice(0, 12)) : ''}</div>
          </div>
        `)
        .join('');
    }
    if (countEl) countEl.textContent = String(events.length);
  }

  function buildPanel() {
    if (panelEl) return panelEl;
    panelEl = document.createElement('div');
    panelEl.className = 'bev-panel';
    panelEl.innerHTML = `
      <div class="bev-header">
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <span class="bev-title">Events</span>
          <span class="bev-count" data-role="count">0</span>
        </div>
        <div class="bev-actions">
          <button type="button" class="bev-action-btn" data-action="copy">Copy JSON</button>
          <button type="button" class="bev-action-btn" data-action="clear">Clear</button>
        </div>
      </div>
      <div class="bev-list" data-role="list"></div>
    `;
    document.body.appendChild(panelEl);
    listEl = panelEl.querySelector('[data-role="list"]');
    countEl = panelEl.querySelector('[data-role="count"]');
    panelEl.querySelector('[data-action="copy"]').addEventListener('click', () => {
      const m = resolveMemory();
      const payload = m ? m.getEvents() : [];
      try {
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      } catch (err) {
        console.error('[bev] clipboard write failed:', err);
      }
    });
    panelEl.querySelector('[data-action="clear"]').addEventListener('click', () => {
      const m = resolveMemory();
      if (m) m.clear();
      renderList();
    });
    return panelEl;
  }

  function openPanel() {
    buildPanel();
    panelEl.style.display = 'flex';
    isOpen = true;
    unreadCount = 0;
    updateBadge();
    renderList();
    // Subscribe to live updates while open
    const m = resolveMemory();
    if (m && !unsubscribe) {
      unsubscribe = m.subscribe(() => {
        if (isOpen) renderList();
      });
    }
  }

  function closePanel() {
    if (panelEl) panelEl.style.display = 'none';
    isOpen = false;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    window.BrikDevBar?.setActive?.('events', false);
  }

  function updateBadge() {
    if (!window.BrikDevBar?.setBadge) return;
    window.BrikDevBar.setBadge('events', unreadCount > 0 ? unreadCount : null);
  }

  // Background subscriber: increments unread count when panel is closed
  // so the slot badge tells you activity happened.
  function ensureBackgroundSubscribe() {
    const m = resolveMemory();
    if (!m || m.__brikEventsBgSubscribed) return;
    m.__brikEventsBgSubscribed = true;
    m.subscribe(() => {
      if (!isOpen) {
        unreadCount++;
        updateBadge();
      }
    });
  }

  // Register with the DevBar (queue fallback if it loads later).
  function register() {
    injectStyles();
    const def = {
      id: 'events',
      label: 'Events',
      icon: icon(),
      order: 40,
      onActivate: () => openPanel(),
      onDeactivate: () => closePanel(),
    };
    if (window.BrikDevBar) {
      window.BrikDevBar.register(def);
    } else {
      window.BrikDevBarQueue = window.BrikDevBarQueue || [];
      window.BrikDevBarQueue.push(def);
    }

    // Poll briefly for a late-loaded MemoryTransport so the background
    // subscriber hooks up even if the SDK initializes after us.
    ensureBackgroundSubscribe();
    memoryCheckIv = setInterval(() => {
      if (resolveMemory()) {
        ensureBackgroundSubscribe();
        clearInterval(memoryCheckIv);
        memoryCheckIv = null;
      }
    }, 500);
    // Give up after 30s — SDK clearly isn't loading here.
    setTimeout(() => {
      if (memoryCheckIv) {
        clearInterval(memoryCheckIv);
        memoryCheckIv = null;
      }
    }, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
})();
