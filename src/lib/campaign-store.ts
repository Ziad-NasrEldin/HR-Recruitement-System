const CAMPAIGN_KEY = "active_campaign";

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
}

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
  };
  saveCampaign(updated);
  return updated;
}
