import { NavLink } from "react-router-dom";
import { CalendarDays, CircleUser, Clock3, LayoutDashboard } from "lucide-react";
import "./BottomNav.css";

const ITEMS = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/attendance", label: "Attendance", icon: Clock3 },
    { to: "/leaves", label: "Leaves", icon: CalendarDays },
    { to: "/profile", label: "Profile", icon: CircleUser },
];

export function BottomNav() {
    return (
        <nav className="bottom-nav" aria-label="Main">
            {ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
                >
                    <span className="bottom-nav__icon">
                        <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
                    </span>
                    <span className="bottom-nav__label">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
