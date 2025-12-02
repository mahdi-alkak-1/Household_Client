import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/Layout.css";
import { Navigate } from "react-router-dom";

export default function DashboardLayout({ children }: any) {
  // If no household is selected, force user to select one.
  const household_id = localStorage.getItem("household_id");
  
  
  if (!household_id) {
    return <Navigate to="/select-household" replace />;
  }

  return (
    <div className="layout-container">
      <Sidebar />

      <div className="layout-content">
        <Topbar />

        <div className="layout-page">
          {children}
        </div>
      </div>
    </div>
  );
}
