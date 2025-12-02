import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import "../../styles/ingredients.css";

export default function Ingredients() {
  const household_id = localStorage.getItem("household_id");

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selected, setSelected] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
  });

  // ---------------------------------------------------------
  // LOAD INGREDIENTS
  // ---------------------------------------------------------
  const fetchIngredients = async () => {
    try {
      const res = await axiosClient.get(`/ingredients/${household_id}`);
      setIngredients(res.data.payload);
    } catch (err) {
      console.error("Error loading ingredients:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // ---------------------------------------------------------
  // ADD INGREDIENT
  // ---------------------------------------------------------
  const addIngredient = async (e: any) => {
    e.preventDefault();

    await axiosClient.post("/ingredients/create", {
      household_id,
      name: form.name,
      category: form.category,
    });

    setOpenAdd(false);
    setForm({ name: "", category: "" });
    fetchIngredients();
  };

  // ---------------------------------------------------------
  // START EDIT MODE
  // ---------------------------------------------------------
  const startEdit = (ing: any) => {
    setSelected(ing);
    setForm({
      name: ing.name,
      category: ing.category,
    });
    setOpenEdit(true);
  };

  // ---------------------------------------------------------
  // SAVE EDIT
  // ---------------------------------------------------------
  const saveEdit = async (e: any) => {
    e.preventDefault();

    await axiosClient.post(`/ingredients/update/${selected.id}`, {
      name: form.name,
      category: form.category,
    });

    setOpenEdit(false);
    fetchIngredients();
  };

  // ---------------------------------------------------------
  // DELETE INGREDIENT
  // ---------------------------------------------------------
  const deleteIngredient = async () => {
    await axiosClient.post(`/ingredients/delete/${selected.id}`);
    setOpenDelete(false);
    fetchIngredients();
  };

  return (
    <DashboardLayout>
      <div className="ingredients-container">
        <div className="ingredients-header">
          <h1>Ingredients</h1>
          <button className="btn-primary" onClick={() => setOpenAdd(true)}>
            + Add Ingredient
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : ingredients.length === 0 ? (
          <p>No ingredients found.</p>
        ) : (
          <div className="ingredients-grid">
            {ingredients.map((ing) => (
              <div key={ing.id} className="ingredients-card">
                <h3>{ing.name}</h3>
                <p className="small">Category: {ing.category}</p>

                <div className="ingredient-actions">
                  <button className="small-btn edit" onClick={() => startEdit(ing)}>
                    Edit
                  </button>

                  <button
                    className="small-btn delete"
                    onClick={() => {
                      setSelected(ing);
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
            <h2>Add Ingredient</h2>

            <form onSubmit={addIngredient}>
              <input
                placeholder="Ingredient Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <input
                placeholder="Category (e.g., Dairy, Meat, Spices)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
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
            <h2>Edit Ingredient</h2>

            <form onSubmit={saveEdit}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
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
            <h2>Delete Ingredient?</h2>
            <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>

            <button className="btn-danger" onClick={deleteIngredient}>
              Delete
            </button>

            <button className="close-btn" onClick={() => setOpenDelete(false)}>Cancel</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
