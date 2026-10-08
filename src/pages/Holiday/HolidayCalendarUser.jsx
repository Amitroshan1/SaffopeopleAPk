import { useState } from "react";
import "./HolidayCalendarUser.css";
import { useRefreshOnNavigate } from "../../hooks/useRefreshOnNavigate";
import { formatDate, parseAppDate } from "../../utils/dateFormat";

const API_BASE = "/api/HumanResource";

function dateBadge(value) {
  const parsed = parseAppDate(value);
  if (!parsed) return { day: "-", month: "" };
  return {
    day: String(parsed.getDate()).padStart(2, "0"),
    month: parsed.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
  };
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const HolidayCalendarUser = () => {
  const [year] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHolidays = async (targetYear) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/holidays/user?year=${targetYear}&auto_seed=1`, {
        method: "GET",
        headers: {
          ...authHeaders(),
        },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load holiday list");
      }
      setRows(result.holidays || []);
    } catch (err) {
      setRows([]);
      setError(err.message || "Failed to load holiday list");
    } finally {
      setLoading(false);
    }
  };

  useRefreshOnNavigate(() => {
    fetchHolidays(year);
  }, [year]);

  return (
    <div className="hc-dashboard-container">
      {error && <div className="hc-error">{error}</div>}

      <div className="hc-card hc-calendar-card">
        <div className="hc-card-header">
          <h2 className="hc-section-title">Holiday Calendar {year}</h2>
          <p className="hc-subtitle">Company holiday list for {year}.</p>
        </div>

        <div className="hc-card-body">
          <div className="hc-table-wrap">
            <table className="hc-table">
              <thead>
                <tr>
                  <th>SR. NO.</th>
                  <th>DATE</th>
                  <th>DAY</th>
                  <th>HOLIDAYS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="hc-empty">Loading holidays...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="hc-empty">No holidays found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const badge = dateBadge(row.holiday_date);
                    return (
                    <tr key={row.id} className={row.is_optional ? "hc-holiday-row is-optional" : "hc-holiday-row"}>
                      <td data-label="Sr. No." className="hc-sr">{row.sr_no}</td>
                      <td data-label="Date" className="hc-date">
                        <span className="hc-date-text">{formatDate(row.holiday_date) || "-"}</span>
                        <span className="hc-date-badge" aria-hidden="true">
                          <span className="hc-date-num">{badge.day}</span>
                          <span className="hc-date-mon">{badge.month}</span>
                        </span>
                      </td>
                      <td data-label="Day" className="hc-day">{row.day || "-"}</td>
                      <td data-label="Holiday" className="hc-name">
                        <span className="hc-name-text">{row.holiday_name}</span>
                        {row.is_optional ? <span className="hc-optional">Optional</span> : null}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="hc-note">
            <strong>NOTE:</strong> Out of 3 optional holidays, you are eligible to opt any one holiday.
          </p>
        </div>
      </div>
    </div>
  );
};
