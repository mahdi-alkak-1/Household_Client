import { Link } from "react-router-dom";
import DashboardLayout from "../../Layout/DashboardLayout";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const today = new Date().toLocaleDateString();

  return (
    <DashboardLayout>
      <div className="dash-wrapper">
        <header className="dash-header">
          <div>
            <h1>Welcome back 👋</h1>
            <p>Plan this week’s meals, keep the pantry fresh, and stay on budget.</p>
          </div>
          <span className="dash-date">{today}</span>
        </header>

        <section className="dash-grid">
          <div className="dash-card">
            <h2>Pantry overview</h2>
            <p>Check what’s expiring soon and what’s running low.</p>
            <Link to="/pantry" className="dash-link">
              Open pantry →
            </Link>
          </div>

          <div className="dash-card">
            <h2>Weekly meal plan</h2>
            <p>Drag recipes into your week and generate a shopping list.</p>
            <Link to="/meal-plan" className="dash-link">
              Plan this week →
            </Link>
          </div>

          <div className="dash-card">
            <h2>Shopping list</h2>
            <p>Use the smart list, mark items as bought at the store.</p>
            <Link to="/shopping" className="dash-link">
              View shopping list →
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
