import { parseAppDate } from './dateFormat';

export const NEWS_FEED_SEEN_EVENT = 'news-feed-seen';

const SEEN_KEY = 'newsFeedSeenIds';
const READY_KEY = 'newsFeedSeenReady';
const NEWS_FEED_VISIBLE_DAYS = 6;

const isNewsFeedPostVisible = (item) => {
    const type = item?.type || 'post';
    if (type !== 'post') return true;
    const created = parseAppDate(item?.created_at);
    if (!created) return true;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - NEWS_FEED_VISIBLE_DAYS);
    return created >= cutoff;
};

const readSeenIds = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
};

export async function fetchVisibleNewsFeed() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    const res = await fetch(`/api/auth/news-feed?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
        },
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.news_feed)) return [];
    return data.news_feed.filter(isNewsFeedPostVisible);
}

/** Count posts the user has not opened. The first load is saved as already seen. */
export function unreadNewsCount(items) {
    const ids = (items || []).map((item) => String(item.id));
    const ready = localStorage.getItem(READY_KEY) === '1';
    if (!ready) {
        localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
        localStorage.setItem(READY_KEY, '1');
        return 0;
    }
    const seen = new Set(readSeenIds());
    return ids.filter((id) => !seen.has(id)).length;
}

export function markNewsFeedSeen(items) {
    const ids = (items || []).map((item) => String(item.id));
    const merged = Array.from(new Set([...readSeenIds(), ...ids]));
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged.slice(-200)));
    localStorage.setItem(READY_KEY, '1');
    window.dispatchEvent(new CustomEvent(NEWS_FEED_SEEN_EVENT));
}
