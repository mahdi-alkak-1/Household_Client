// src/Layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/ingredients", label: "Ingredients", icon: "🥦" },
  { to: "/pantry", label: "Pantry", icon: "🧊" },
  { to: "/recipes", label: "Recipes", icon: "📖" },
  { to: "/shopping", label: "Shopping", icon: "🛒" },
  { to: "/expenses", label: "Expenses", icon: "💰" }, // NEW
  { to: "/meal-plan", label: "Meal Plan", icon: "🍽" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">HP</div>
        <div className="sidebar-appname">
          <span>HousePlan</span>
          <small>Meal & pantry hub</small>
        </div>
      </div>

      <nav className="sidebar-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end as any}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
