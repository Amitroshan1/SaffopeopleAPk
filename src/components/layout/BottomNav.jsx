import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { CalendarDays, CircleUser, Clock3, LayoutDashboard } from "lucide-react";
import { isNativeApp } from "../../mobile/native/platform";
import "./BottomNav.css";

const ITEMS = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/attendance", label: "Attendance", icon: Clock3 },
    { to: "/leaves", label: "Leaves", icon: CalendarDays },
    { to: "/profile", label: "Profile", icon: CircleUser },
];

export function BottomNav() {
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    useEffect(() => {
        if (!isNativeApp() || Capacitor.getPlatform() !== "ios") {
            return undefined;
        }

        let showSub;
        let hideSub;
        let cancelled = false;

        const bind = async () => {
            try {
                const { Keyboard } = await import("@capacitor/keyboard");
                if (cancelled) return;
                showSub = await Keyboard.addListener("keyboardWillShow", () => {
                    setKeyboardOpen(true);
                });
                hideSub = await Keyboard.addListener("keyboardWillHide", () => {
                    setKeyboardOpen(false);
                });
            } catch {
                /* Keyboard plugin optional */
            }
        };

        void bind();

        return () => {
            cancelled = true;
            showSub?.remove?.();
            hideSub?.remove?.();
        };
    }, []);

    if (keyboardOpen) {
        return null;
    }

    return (
        <nav className="bottom-nav" aria-label="Main">
            {ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `bottom-nav__item${isActive ? " is-active" : ""}`}
                    >
                        <span className="bottom-nav__icon">
                            <ItemIcon size={20} strokeWidth={2.25} aria-hidden="true" />
                        </span>
                        <span className="bottom-nav__label">{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
