import { useEffect, useState } from 'react';
import { formatDateDDMMYYYY } from '../../utils/dateFormat';
import { fetchVisibleNewsFeed, markNewsFeedSeen } from '../../utils/newsFeed';
import './NewsFeedPage.css';

const formatDate = (value) => formatDateDDMMYYYY(value, 'N/A');

export function NewsFeedPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const next = await fetchVisibleNewsFeed();
                if (cancelled) return;
                setItems(next);
                markNewsFeedSeen(next);
            } catch {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="news-feed-page">
            {loading ? (
                <div className="news-feed-page__card news-feed-page__card--empty">
                    <p className="news-feed-page__empty">Loading announcements…</p>
                </div>
            ) : items.length === 0 ? (
                <div className="news-feed-page__card news-feed-page__card--empty">
                    <h2 className="news-feed-page__empty-title">No announcements yet</h2>
                    <p className="news-feed-page__empty">New updates will show up here.</p>
                </div>
            ) : (
                <ul className="news-feed-page__list">
                    {items.map((item) => {
                        const type = item.type || 'post';
                        return (
                            <li
                                key={item.id}
                                className={`news-feed-page__item news-feed-page__item--${type}`}
                            >
                                <h2 className="news-feed-page__title">
                                    {type === 'birthday' && '🎂 '}
                                    {type === 'anniversary' && '🎉 '}
                                    {item.title}
                                </h2>
                                {item.content ? (
                                    <p className="news-feed-page__content">{item.content}</p>
                                ) : null}
                                <div className="news-feed-page__meta">
                                    <span>{formatDate(item.created_at)}</span>
                                    {(item.file_url || item.file_path) && (
                                        <a
                                            href={item.file_url || `/static/uploads/${item.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Attachment
                                        </a>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
