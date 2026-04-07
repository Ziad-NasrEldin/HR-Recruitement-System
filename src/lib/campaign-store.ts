const CAMPAIGN_KEY = "active_campaign";
const HISTORY_KEY = "campaign_history";
const SAVED_POSTS_KEY = "campaign_saved_posts";
const MAX_HISTORY = 50;

export interface CampaignGroup {
  id: string;
  name: string;
  url: string;
}

export interface Campaign {
  posts: string[];
  groups: CampaignGroup[];
  currentIndex: number;
  intervalMinutes: number;
  lastPostAt: number | null;
  isActive: boolean;
  offerLabel: string;
  startedAt: number;
  postedCount: number;
  skippedCount: number;
}

export interface CampaignHistoryEntry {
  id: string;
  offerLabel: string;
  startedAt: number;
  completedAt: number;
  totalGroups: number;
  postedCount: number;
  skippedCount: number;
}

export interface SavedPosts {
  posts: string[];
  offerLabel: string;
  savedAt: number;
}

// ── Active campaign ───────────────────────────────────────

export function getCampaign(): Campaign | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    return raw ? (JSON.parse(raw) as Campaign) : null;
  } catch {
    return null;
  }
}

export function saveCampaign(campaign: Campaign): void {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
}

export function clearCampaign(): void {
  localStorage.removeItem(CAMPAIGN_KEY);
}

/** Seconds until next post. 0 or negative = post now. */
export function getTimeLeft(campaign: Campaign): number {
  if (campaign.lastPostAt === null) return 0;
  const elapsed = Math.floor((Date.now() - campaign.lastPostAt) / 1000);
  return campaign.intervalMinutes * 60 - elapsed;
}

/** Returns updated campaign after a post is made. */
export function advanceCampaign(campaign: Campaign): Campaign {
  const updated: Campaign = {
    ...campaign,
    currentIndex: campaign.currentIndex + 1,
    lastPostAt: Date.now(),
    postedCount: (campaign.postedCount ?? 0) + 1,
  };
  saveCampaign(updated);
  return updated;
}

/** Returns updated campaign after skipping current group. */
export function skipCampaign(campaign: Campaign): Campaign {
  const updated: Campaign = {
    ...campaign,
    currentIndex: campaign.currentIndex + 1,
    lastPostAt: Date.now(),
    skippedCount: (campaign.skippedCount ?? 0) + 1,
  };
  saveCampaign(updated);
  return updated;
}

// ── Campaign history ──────────────────────────────────────

export function getHistory(): CampaignHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as CampaignHistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(entry: CampaignHistoryEntry): void {
  const history = getHistory();
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ── Saved posts (for campaign start) ─────────────────────

export function getSavedPosts(): SavedPosts | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY);
    return raw ? (JSON.parse(raw) as SavedPosts) : null;
  } catch {
    return null;
  }
}

export function savePosts(data: SavedPosts): void {
  localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(data));
}

export function clearSavedPosts(): void {
  localStorage.removeItem(SAVED_POSTS_KEY);
}
