import { useCallback, useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { isNativeApp } from '../mobile/native/platform';
import { APP_SOFT_REFRESH_EVENT } from '../utils/homepageApi';
import { fetchVisibleNewsFeed, NEWS_FEED_SEEN_EVENT, unreadNewsCount } from '../utils/newsFeed';

export function useNewsUnreadCount() {
    const [count, setCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const items = await fetchVisibleNewsFeed();
            setCount(unreadNewsCount(items));
        } catch {
            setCount(0);
        }
    }, []);

    useEffect(() => {
        void refresh();
        const timer = window.setInterval(() => {
            void refresh();
        }, 60000);
        const onUpdate = () => {
            void refresh();
        };
        window.addEventListener(NEWS_FEED_SEEN_EVENT, onUpdate);
        window.addEventListener(APP_SOFT_REFRESH_EVENT, onUpdate);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener(NEWS_FEED_SEEN_EVENT, onUpdate);
            window.removeEventListener(APP_SOFT_REFRESH_EVENT, onUpdate);
        };
    }, [refresh]);

    useEffect(() => {
        if (!isNativeApp()) return undefined;
        let listener;
        const init = async () => {
            listener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                if (isActive) void refresh();
            });
        };
        void init();
        return () => {
            listener?.remove?.();
        };
    }, [refresh]);

    return count;
}
