import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/Topbar.css";

export default function Topbar() {
  const { logout } = useContext(AuthContext);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">🥕</span>
        <div className="topbar-brand">
          <span className="topbar-title">HousePlan</span>
          <span className="topbar-subtitle">
            Smart pantry & weekly meal planner
          </span>
        </div>
      </div>

      <div className="topbar-right">
        {/* later we can show user name/avatar here */}
        <button className="topbar-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
