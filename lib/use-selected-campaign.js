'use client';

/**
 * The campaign the admin is looking at, shared by every admin page so it does not have to be picked
 * again when switching tabs. Order of precedence: ?campaign= in the URL, then the last choice kept
 * in localStorage, then '' (each page falls back to its own default, the newest campaign).
 */
import { useCallback, useState } from 'react';

const KEY = 'ps_campaign';

function initialCampaign() {
  if (typeof window === 'undefined') return '';
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('campaign');
    if (fromUrl) {
      // Arriving through a link with ?campaign= makes that the choice for the other tabs too.
      try { localStorage.setItem(KEY, fromUrl); } catch { /* storage unavailable */ }
      return fromUrl;
    }
  } catch { /* ignore malformed URLs */ }
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

/** Adds the selected campaign to an admin link so the next page opens on the same one. */
export function withCampaign(href, campaignId) {
  if (!campaignId) return href;
  return `${href}${href.includes('?') ? '&' : '?'}campaign=${encodeURIComponent(campaignId)}`;
}

export default function useSelectedCampaign() {
  const [campaignId, setState] = useState(initialCampaign);

  const setCampaignId = useCallback((id) => {
    setState(id);
    try {
      if (id) localStorage.setItem(KEY, id);
      else localStorage.removeItem(KEY);
    } catch { /* storage unavailable */ }
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set('campaign', id);
      else url.searchParams.delete('campaign');
      window.history.replaceState(window.history.state, '', url);
    } catch { /* ignore */ }
  }, []);

  return [campaignId, setCampaignId];
}
