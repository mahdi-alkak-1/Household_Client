// src/pages/Households/SelectHousehold.tsx
import { useEffect, useState, useContext } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/Households.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function SelectHousehold() {
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const fetchHouseholds = async () => {
    try {
      const res = await axiosClient.get("/households");
      setHouseholds(res.data.payload ?? []);
    } catch (err) {
      console.error("Error loading households:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const select = (h: any) => {
    localStorage.setItem("household_id", String(h.id));
    navigate("/");
  };

  const createHousehold = async (e: any) => {
    e.preventDefault();
    await axiosClient.post("/households/create", { name });
    setName("");
    setOpenCreate(false);
    fetchHouseholds();
  };

  const joinHousehold = async (e: any) => {
    e.preventDefault();
    await axiosClient.post("/households/join", { invite_code: inviteCode });
    setInviteCode("");
    setOpenJoin(false);
    fetchHouseholds();
  };

  return (
    <div className="household-container">
      {/* mini topbar with logout */}
      <div className="hh-topbar">
        <div className="hh-topbar-left">
          <span className="hh-logo">🥕</span>
          <span className="hh-title">HousePlan</span>
        </div>
        <div className="hh-topbar-right">
          {user && (
            <span className="hh-user-label">
              {user.name ?? user.email}
            </span>
          )}
          <button className="hh-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="hh-hero">
        <h1>Choose your home base 🏡</h1>
        <p>
          Households keep pantry, recipes, and budgets separate. Select one or
          create a new space to get started.
        </p>
      </div>

      {loading ? (
        <p>Loading households...</p>
      ) : (
        <div className="hh-grid">
          {households.length === 0 && (
            <div className="hh-empty">
              <p>You don’t belong to any household yet.</p>
              <p>Create one or join with an invite code.</p>
            </div>
          )}

          {households.map((h) => (
            <button
              key={h.id}
              className="hh-card"
              onClick={() => select(h)}
            >
              <div className="hh-card-header">
                <span className="hh-badge">Household</span>
                <span className="hh-members">
                  👥 {h.users_count ?? 1} member
                  {((h.users_count ?? 1) as number) > 1 ? "s" : ""}
                </span>
              </div>
              <h2>{h.name}</h2>
              {h.invite_code && (
                <p className="hh-invite">Invite code: {h.invite_code}</p>
              )}
            </button>
          ))}

          <button
            className="hh-card hh-create"
            onClick={() => setOpenCreate(true)}
          >
            <span className="hh-big-icon">＋</span>
            <h2>Create new household</h2>
            <p>Perfect if you’re setting up a new home or project.</p>
          </button>

          <button
            className="hh-card hh-join"
            onClick={() => setOpenJoin(true)}
          >
            <span className="hh-big-icon">🔑</span>
            <h2>Join with invite code</h2>
            <p>Already invited by someone? Enter their code here.</p>
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {openCreate && (
        <div className="hh-modal-overlay">
          <div className="hh-modal">
            <h2>Create household</h2>
            <p className="hh-modal-sub">
              Give your household a friendly name (e.g. “Home”, “Roommates”…)
            </p>

            <form onSubmit={createHousehold} className="hh-modal-form">
              <input
                placeholder="Household name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <button className="btn-primary">Create</button>
            </form>

            <button
              className="hh-modal-close"
              onClick={() => setOpenCreate(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {openJoin && (
        <div className="hh-modal-overlay">
          <div className="hh-modal">
            <h2>Join household</h2>
            <p className="hh-modal-sub">
              Paste the invite code that someone shared with you.
            </p>

            <form onSubmit={joinHousehold} className="hh-modal-form">
              <input
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <button className="btn-primary">Join</button>
            </form>

            <button
              className="hh-modal-close"
              onClick={() => setOpenJoin(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
