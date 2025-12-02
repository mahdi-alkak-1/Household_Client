import DashboardLayout from "../../Layout/DashboardLayout";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/Profile.css";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  return (
    <DashboardLayout>
      <div className="profile-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">👤</div>

        <div className="profile-info">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
        </div>

        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </DashboardLayout>
  );
}
