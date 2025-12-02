// src/pages/Recipes/Recipes.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import Modal from "../../components/Modal";
import "../../styles/Recipes.css";

export default function Recipes() {
  const nav = useNavigate();
  const household_id = localStorage.getItem("household_id");

  // ------------------------------------------------------------
  // REDIRECT IF NO HOUSEHOLD
  // ------------------------------------------------------------
  useEffect(() => {
    if (!household_id) {
      nav("/select-household");
      return;
    }
    loadData();
  }, [household_id]);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    instructions: "",
  });

  const [rows, setRows] = useState<
    { ingredient_id: string; quantity: string; unit: string }[]
  >([]);

  // ------------------------------------------------------------
  // HELPER: CLEAN PAYLOAD
  // ------------------------------------------------------------
  const normalizeRow = (row: any) => ({
    ingredient_id: Number(row.ingredient_id),
    quantity: Number(row.quantity) || 0,
    unit: row.unit ? row.unit.toString().trim() : "",
  });

  // ------------------------------------------------------------
  // LOAD RECIPES + INGREDIENTS
  // ------------------------------------------------------------
  const loadData = async () => {
    if (!household_id) return;

    try {
      const rec = await axiosClient.get(`/recipes/${household_id}`);
      setRecipes(rec.data.payload ?? []);

      const ing = await axiosClient.get(`/ingredients/${household_id}`);
      setIngredients(ing.data.payload ?? []);
    } catch (err) {
      console.error("Load error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [household_id]);

  // ------------------------------------------------------------
  // DYNAMIC ROW HANDLERS
  // ------------------------------------------------------------
  const addRow = () => {
    setRows((prev) => [...prev, { ingredient_id: "", quantity: "", unit: "" }]);
  };

  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, key: string, val: string) => {
    setRows((prev) => {
      const draft = [...prev];
      draft[i][key] = val;

      // Avoid duplicate ingredients
      if (key === "ingredient_id") {
        const ids = draft.map((r) => r.ingredient_id).filter(Boolean);
        const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);

        if (duplicates.length > 0) {
          alert("This ingredient is already added!");
          return prev; // cancel update
        }
      }

      return draft;
    });
  };

  // ------------------------------------------------------------
  // CREATE RECIPE
  // ------------------------------------------------------------
  const handleAddRecipe = async (e: any) => {
    e.preventDefault();

    const res = await axiosClient.post("/recipes/create", {
      household_id,
      title: form.title,
      instructions: form.instructions,
    });

    const recipeId = res.data.payload.id;

    await Promise.all(
      rows.map((row) =>
        row.ingredient_id
          ? axiosClient.post(`/recipe-ingredients/attach/${recipeId}`, normalizeRow(row))
          : null
      )
    );

    setForm({ title: "", instructions: "" });
    setRows([]);
    setOpenAdd(false);
    await loadData();
  };

  // ------------------------------------------------------------
  // OPEN EDIT MODAL
  // ------------------------------------------------------------
  const openEditModal = (recipe: any) => {
    setSelectedRecipe(recipe);

    setForm({
      title: recipe.title,
      instructions: recipe.instructions,
    });

    const mapped =
      recipe.ingredients?.map((ing: any) => ({
        ingredient_id: ing.id,
        quantity: ing.pivot.quantity,
        unit: ing.pivot.unit,
      })) ?? [];

    setRows(mapped);
    setOpenEdit(true);
  };

  // ------------------------------------------------------------
  // EDIT RECIPE
  // ------------------------------------------------------------
  const handleEditRecipe = async (e: any) => {
    e.preventDefault();
    const id = selectedRecipe.id;

    await axiosClient.post(`/recipes/update/${id}`, {
      title: form.title,
      instructions: form.instructions,
    });

    // Detach all previous ingredients
    await Promise.all(
      (selectedRecipe.ingredients ?? []).map((ing: any) =>
        axiosClient.post(`/recipe-ingredients/detach/${id}/${ing.id}`)
      )
    );
    console.log("rows are",rows);
    // Attach new ingredients
    await Promise.all(
      rows.map((row) =>
        row.ingredient_id
          ? axiosClient.post(`/recipe-ingredients/attach/${id}`, normalizeRow(row))
          : null
      )
    );
    
    setOpenEdit(false);
    await loadData();
  };

  // ------------------------------------------------------------
  // DELETE RECIPE
  // ------------------------------------------------------------
  const handleDelete = async () => {
    await axiosClient.post(`/recipes/delete/${selectedRecipe.id}`);
    setOpenDelete(false);
    await loadData();
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="recipes-header">
        <h1>Recipes</h1>
        <button className="btn-primary" onClick={() => setOpenAdd(true)}>
          + Add Recipe
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : recipes.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        <div className="recipes-grid">
          {recipes.map((r) => (
            <div className="recipe-card" key={r.id}>
              <h3>{r.title}</h3>

              <p><strong>Ingredients:</strong></p>
              <ul>
                {r.ingredients?.length > 0 ? (
                  r.ingredients.map((ing: any) => (
                    <li key={ing.id}>
                      {ing.name} — {ing.pivot.quantity} {ing.pivot.unit}
                    </li>
                  ))
                ) : (
                  <li>No ingredients</li>
                )}
              </ul>

              <p className="instructions">
                <strong>Instructions:</strong><br />
                {r.instructions}
              </p>

              <div className="recipe-actions">
                <button className="small-btn edit" onClick={() => openEditModal(r)}>
                  Edit
                </button>

                <button
                  className="small-btn delete"
                  onClick={() => {
                    setSelectedRecipe(r);
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

      {/* ADD MODAL */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Recipe">
        <form className="modal-form" onSubmit={handleAddRecipe}>
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <label>Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            required
          />

          <hr />
          <h4>Ingredients</h4>

          {rows.map((row, i) => (
            <div key={i} className="ingredient-row">
              <select
                value={row.ingredient_id}
                onChange={(e) => updateRow(i, "ingredient_id", e.target.value)}
              >
                <option value="">Select ingredient</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
              />

              <input
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateRow(i, "unit", e.target.value)}
              />

              <button type="button" onClick={() => removeRow(i)}>
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="add-row" onClick={addRow}>
            + Add Ingredient
          </button>

          <button className="btn-primary modal-submit">Save</button>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Recipe">
        <form className="modal-form" onSubmit={handleEditRecipe}>
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <label>Instructions</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            required
          />

          <hr />
          <h4>Ingredients</h4>

          {rows.map((row, i) => (
            <div key={i} className="ingredient-row">
              <select
                value={row.ingredient_id}
                onChange={(e) => updateRow(i, "ingredient_id", e.target.value)}
              >
                <option value="">Select ingredient</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
              />

              <input
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => updateRow(i, "unit", e.target.value)}
              />

              <button type="button" onClick={() => removeRow(i)}>
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="add-row" onClick={addRow}>
            + Add Ingredient
          </button>

          <button className="btn-primary modal-submit">Save</button>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal open={openDelete} onClose={() => setOpenDelete(false)} title="Delete Recipe">
        <p>
          Are you sure you want to delete{" "}
          <strong>{selectedRecipe?.title}</strong>?
        </p>
        <button className="btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </Modal>
    </DashboardLayout>
  );
}
