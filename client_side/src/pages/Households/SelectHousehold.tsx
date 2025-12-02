import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/Households.css";
import { useNavigate } from "react-router-dom";

export default function SelectHousehold() {
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openJoin, setOpenJoin] = useState(false);

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const navigate = useNavigate();

  // -------------------------------------------------------------
  // LOAD ALL HOUSEHOLDS FOR CURRENT USER
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // SELECT HOUSEHOLD
  // -------------------------------------------------------------
  const select = (h: any) => {
    localStorage.setItem("household_id", String(h.id));
    navigate("/"); // go to dashboard home
  };

  // -------------------------------------------------------------
  // CREATE NEW HOUSEHOLD
  // -------------------------------------------------------------
  const createHousehold = async (e: any) => {
    e.preventDefault();

    await axiosClient.post("/households/create", { name });

    setName("");
    setOpenCreate(false);
    fetchHouseholds();
  };

  // -------------------------------------------------------------
  // JOIN HOUSEHOLD
  // -------------------------------------------------------------
  const joinHousehold = async (e: any) => {
    e.preventDefault();

    await axiosClient.post("/households/join", { invite_code: inviteCode });

    setInviteCode("");
    setOpenJoin(false);
    fetchHouseholds();
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <div className="household-container">
      <h1 className="hh-title">Select Your Household</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="hh-grid">
          {households.length === 0 && <p>You have no households yet.</p>}

          {households.map((h) => (
            <div
              key={h.id}
              className="hh-card"
              onClick={() => select(h)}
            >
              <h2>{h.name}</h2>
              <p>Members: {h.users_count ?? 1}</p>
            </div>
          ))}

          {/* CREATE */}
          <div className="hh-card create" onClick={() => setOpenCreate(true)}>
            <span className="plus">+</span>
            <p>Create Household</p>
          </div>

          {/* JOIN */}
          <div className="hh-card join" onClick={() => setOpenJoin(true)}>
            <span className="plus">🔑</span>
            <p>Join Household</p>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {openCreate && (
        <div className="hh-modal-overlay">
          <div className="hh-modal">
            <h2>Create Household</h2>

            <form onSubmit={createHousehold}>
              <input
                placeholder="Household Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <button className="btn-primary">Create</button>
            </form>

            <button
              className="close-btn"
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
            <h2>Join Household</h2>

            <form onSubmit={joinHousehold}>
              <input
                placeholder="Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <button className="btn-primary">Join</button>
            </form>

            <button
              className="close-btn"
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
