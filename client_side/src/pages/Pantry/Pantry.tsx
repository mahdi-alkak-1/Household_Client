import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import "../../styles/pantry.css";

export default function Pantry() {
  const household_id = localStorage.getItem("household_id");

  const [items, setItems] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selected, setSelected] = useState<any>(null);

  const [form, setForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit: "",
    expiry_date: "",
    location: "",
  });

  // ---------------------------------------------------------
  // LOAD PANTRY + INGREDIENTS
  // ---------------------------------------------------------
  const fetchAll = async () => {
    try {
      const p = await axiosClient.get(`/pantry/${household_id}`);
      const ing = await axiosClient.get(`/ingredients/${household_id}`);

      setItems(p.data.payload);
      setIngredients(ing.data.payload);
    } catch (err) {
      console.error("Error loading pantry:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ---------------------------------------------------------
  // ADD PANTRY ITEM
  // ---------------------------------------------------------
  const addItem = async (e: any) => {
    e.preventDefault();

    await axiosClient.post("/pantry/create", {
      household_id,
      ingredient_id: form.ingredient_id,
      quantity: form.quantity,
      unit: form.unit,
      expiry_date: form.expiry_date,
      location: form.location,
    });

    setOpenAdd(false);
    setForm({
      ingredient_id: "",
      quantity: "",
      unit: "",
      expiry_date: "",
      location: "",
    });

    fetchAll();
  };

  // ---------------------------------------------------------
  // START EDIT MODE
  // ---------------------------------------------------------
  const startEdit = (item: any) => {
    setSelected(item);

    setForm({
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      expiry_date: item.expiry_date ?? "",
      location: item.location ?? "",
    });

    setOpenEdit(true);
  };

  // ---------------------------------------------------------
  // SAVE EDIT
  // ---------------------------------------------------------
  const saveEdit = async (e: any) => {
    e.preventDefault();

    await axiosClient.post(`/pantry/update/${selected.id}`, {
      ingredient_id: form.ingredient_id,
      quantity: form.quantity,
      unit: form.unit,
      expiry_date: form.expiry_date,
      location: form.location,
    });

    setOpenEdit(false);
    fetchAll();
  };

  // ---------------------------------------------------------
  // DELETE ITEM
  // ---------------------------------------------------------
  const deleteItem = async () => {
    await axiosClient.post(`/pantry/delete/${selected.id}`);
    setOpenDelete(false);
    fetchAll();
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="pantry-container">
        <div className="pantry-header">
          <h1>Pantry</h1>
          <button className="btn-primary" onClick={() => setOpenAdd(true)}>
            + Add Item
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No pantry items yet.</p>
        ) : (
          <div className="pantry-grid">
            {items.map((item) => (
              <div className="pantry-card" key={item.id}>
                <h3>{item.ingredient?.name}</h3>

                <p>
                  {item.quantity} {item.unit}
                </p>

                {item.expiry_date && (
                  <p className="small">Expiry: {item.expiry_date}</p>
                )}

                {item.location && <p className="small">Location: {item.location}</p>}

                <div className="pantry-actions">
                  <button className="small-btn edit" onClick={() => startEdit(item)}>
                    Edit
                  </button>

                  <button
                    className="small-btn delete"
                    onClick={() => {
                      setSelected(item);
                      setOpenDelete(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {openAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Pantry Item</h2>

            <form onSubmit={addItem}>
              <select
                value={form.ingredient_id}
                onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
                required
              >
                <option value="">Select Ingredient</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.category})
                  </option>
                ))}
              </select>

              <input
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />

              <input
                placeholder="Unit (kg, g, pcs...)"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
              />

              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />

              <input
                placeholder="Location (Fridge, Freezer...)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <button className="btn-primary">Add</button>
            </form>

            <button className="close-btn" onClick={() => setOpenAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {openEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Pantry Item</h2>

            <form onSubmit={saveEdit}>
              <select
                value={form.ingredient_id}
                onChange={(e) => setForm({ ...form, ingredient_id: e.target.value })}
                required
              >
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.category})
                  </option>
                ))}
              </select>

              <input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />

              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                required
              />

              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />

              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <button className="btn-primary">Save</button>
            </form>

            <button className="close-btn" onClick={() => setOpenEdit(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {openDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Delete Item?</h2>
            <p>Are you sure you want to delete {selected?.ingredient?.name}?</p>

            <button className="btn-danger" onClick={deleteItem}>
              Delete
            </button>

            <button className="close-btn" onClick={() => setOpenDelete(false)}>Cancel</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
