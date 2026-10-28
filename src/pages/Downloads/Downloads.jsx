import { useCallback, useEffect, useMemo, useState } from "react";
import { FaTrash, FaExternalLinkAlt, FaFileAlt } from "react-icons/fa";
import { useUser } from "../../components/layout/UserContext";
import {
  listUserDownloads,
  removeUserDownload,
  clearUserDownloads,
  openUserDownload,
  resolveDownloadUserId,
} from "../../mobile/native/nativeDownload";
import { isNativeApp } from "../../mobile/native/platform";
import { formatDateTime as formatDateTimeDDMMYYYY } from "../../utils/dateFormat";
import "./Downloads.css";

function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return "";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function Downloads() {
  const { userData } = useUser();
  const userId = useMemo(
    () => resolveDownloadUserId(userData?.user?.id || userData?.user?.admin_id),
    [userData?.user?.id, userData?.user?.admin_id]
  );
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const native = useMemo(() => isNativeApp(), []);

  const reload = useCallback(() => {
    setItems(listUserDownloads(userId));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleOpen = async (item) => {
    if (!item?.uri || !native) {
      alert(
        native
          ? "This file is no longer available on this device."
          : "Browser downloads are saved by your browser. Open them from your device Downloads folder."
      );
      return;
    }
    setBusyId(item.id);
    try {
      await openUserDownload(item);
    } catch (e) {
      alert(e?.message || "Unable to open file");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    const ok = window.confirm(`Remove "${item.fileName}" from your downloads?`);
    if (!ok) return;
    setBusyId(item.id);
    try {
      const next = await removeUserDownload(userId, item.id);
      setItems(next);
    } catch (e) {
      alert(e?.message || "Unable to remove file");
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAll = async () => {
    if (!items.length) return;
    const ok = window.confirm("Clear all downloads for your account on this device?");
    if (!ok) return;
    setClearing(true);
    try {
      const next = await clearUserDownloads(userId, { deleteFiles: native });
      setItems(next);
    } catch (e) {
      alert(e?.message || "Unable to clear downloads");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="downloads-page">
      {items.length > 0 && (
        <div className="downloads-toolbar">
          <span className="downloads-count">{items.length} file{items.length === 1 ? "" : "s"}</span>
          <button
            type="button"
            className="downloads-clear-btn"
            onClick={handleClearAll}
            disabled={clearing}
          >
            {clearing ? "Clearing..." : "Clear all"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="downloads-empty">
          <FaFileAlt aria-hidden />
          <p>No downloads yet</p>
          <span>Payslips, attendance Excel and profile documents will show here after you download them.</span>
        </div>
      ) : (
        <ul className="downloads-list">
          {items.map((item) => (
            <li key={item.id} className="downloads-item">
              <div className="downloads-item-copy">
                <p className="downloads-item-name" title={item.fileName}>
                  {item.fileName}
                </p>
                  <p className="downloads-item-meta">
                    {formatDateTimeDDMMYYYY(item.downloadedAt) || item.downloadedAt}
                    {item.size != null ? ` · ${formatBytes(item.size)}` : ""}
                  </p>
              </div>
              <div className="downloads-item-actions">
                {native && item.uri && (
                  <button
                    type="button"
                    className="downloads-action-btn"
                    onClick={() => handleOpen(item)}
                    disabled={busyId === item.id}
                  >
                    <FaExternalLinkAlt />
                    <span>{busyId === item.id ? "Opening..." : "Open"}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="downloads-action-btn downloads-action-btn--danger"
                  onClick={() => handleDelete(item)}
                  disabled={busyId === item.id}
                >
                  <FaTrash />
                  <span>Remove</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
