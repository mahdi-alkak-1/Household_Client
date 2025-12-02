import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">HousePlan</div>

      <nav className="sidebar-links">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/ingredients">Ingredients</NavLink>
        <NavLink to="/pantry">Pantry</NavLink>
        <NavLink to="/recipes">Recipes</NavLink>
        <NavLink to="/shopping">Shopping</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        
      </nav>
    </aside>
  );
}
