// src/pages/Shopping/ShoppingList.tsx
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import Modal from "../../components/Modal";
import "../../styles/shopping.css";

type ListItem = {
  id: number;
  name: string;
  quantity: number | string | null;
  unit?: string | null;   // used as "location" for pantry/manual, measurement for meal-plan
  bought: boolean;
};

type List = {
  id: number;
  name: string;
};

export default function ShoppingList() {
  const household_id = localStorage.getItem("household_id");

  // ------------------------------------------------------------
  // LIST & ITEM STATE
  // ------------------------------------------------------------
  const [lists, setLists] = useState<List[]>([]);
  const [currentList, setCurrentList] = useState<List | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);

  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // ------------------------------------------------------------
  // MODALS
  // ------------------------------------------------------------
  const [openAddItem, setOpenAddItem] = useState(false);
  const [openEditItem, setOpenEditItem] = useState(false);
  const [openDeleteItem, setOpenDeleteItem] = useState(false);

  const [openNewList, setOpenNewList] = useState(false);
  const [openRenameList, setOpenRenameList] = useState(false);

  // checkout → pantry modal
  const [openCheckout, setOpenCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    expiry_date: "",
    location: "",
  });

  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  // ------------------------------------------------------------
  // FORM STATE
  // ------------------------------------------------------------
  const [itemForm, setItemForm] = useState({
    name: "",
    quantity: "",
    category: "",
  });

  const [newListName, setNewListName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------
  const lastListKey = "last_shopping_list_id";

  const rememberCurrentList = (id: number) => {
    localStorage.setItem(lastListKey, String(id));
  };

  const normalizeQuantity = (q: string | number | null) => {
    if (q === null || q === "") return null;
    const n = Number(q);
    return isNaN(n) ? null : n;
  };

  // units that mean "this came from the meal plan"
  const measureUnits = new Set(
    [
      "g",
      "gram",
      "grams",
      "kg",
      "ml",
      "l",
      "liter",
      "litre",
      "liters",
      "piece",
      "pieces",
      "pc",
      "pcs",
      "tbsp",
      "tablespoon",
      "tsp",
      "teaspoon",
      "cup",
      "cups",
      "head",
      "heads",
      "clove",
      "cloves",
      "can",
      "cans",
      "packet",
      "packets",
      "slice",
      "slices",
    ].map((u) => u.toLowerCase())
  );

  const splitBySource = (all: ListItem[]) => {
    const mealPlanItems: ListItem[] = [];
    const pantryItems: ListItem[] = [];

    for (const it of all) {
      const unit = (it.unit || "").toLowerCase().trim();
      if (unit && measureUnits.has(unit)) {
        mealPlanItems.push(it);
      } else {
        pantryItems.push(it);
      }
    }

    return { mealPlanItems, pantryItems };
  };

  const groupPantryByLocation = (pantryItems: ListItem[]) => {
    const groups: Record<string, ListItem[]> = {};
    for (const it of pantryItems) {
      const loc = (it.unit || "Unsorted").trim() || "Unsorted";
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(it);
    }

    Object.keys(groups).forEach((loc) => {
      groups[loc].sort((a, b) => {
        if (a.bought !== b.bought) return a.bought ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  };

  // ------------------------------------------------------------
  // LOAD LISTS
  // ------------------------------------------------------------
  const loadLists = async () => {
    if (!household_id) {
      setLoadingLists(false);
      return;
    }

    try {
      const res = await axiosClient.get(`/shopping-lists/${household_id}`);
      const loaded: List[] = res.data.payload ?? [];
      setLists(loaded);

      if (loaded.length === 0) {
        setCurrentList(null);
        setItems([]);
        setLoadingLists(false);
        setLoadingItems(false);
        return;
      }

      const lastIdStr = localStorage.getItem(lastListKey);
      const lastId = lastIdStr ? Number(lastIdStr) : null;

      const preferred = loaded.find((l) => l.id === lastId) ?? loaded[0];

      setCurrentList(preferred);
      rememberCurrentList(preferred.id);
    } catch (err) {
      console.error("Load lists error:", err);
    }
    setLoadingLists(false);
  };

  // ------------------------------------------------------------
  // LOAD ITEMS FOR A LIST
  // ------------------------------------------------------------
  const loadItems = async (listId: number) => {
    setLoadingItems(true);
    try {
      const res = await axiosClient.get(`/shopping-lists/show/${listId}`);
      const loaded: ListItem[] = res.data.payload.items ?? [];
      setItems(loaded);
    } catch (err) {
      console.error("Load items error:", err);
    }
    setLoadingItems(false);
  };

  // initial load
  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when list changes
  useEffect(() => {
    if (currentList) {
      rememberCurrentList(currentList.id);
      loadItems(currentList.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentList]);

  // ------------------------------------------------------------
  // CREATE NEW LIST
  // ------------------------------------------------------------
  const handleCreateList = async (e: any) => {
    e.preventDefault();
    if (!household_id) return;

    try {
      const res = await axiosClient.post("/shopping-lists/create", {
        household_id: Number(household_id),
        name: newListName || `List ${new Date().toLocaleDateString()}`,
      });

      setOpenNewList(false);
      setNewListName("");

      await loadLists();
      const created: List = res.data.payload;
      setCurrentList(created);
    } catch (err) {
      console.error("Create list error:", err);
    }
  };

  // ------------------------------------------------------------
  // RENAME LIST
  // ------------------------------------------------------------
  const renameList = async (e: any) => {
    e.preventDefault();
    if (!currentList || !household_id) return;

    try {
      await axiosClient.post(`/shopping-lists/update/${currentList.id}`, {
        household_id: Number(household_id),
        name: renameValue,
      });

      setOpenRenameList(false);
      await loadLists();
    } catch (err) {
      console.error("Rename list error:", err);
    }
  };

  // ------------------------------------------------------------
  // AUTO-GENERATE FROM PANTRY (FRONTEND LOGIC)
  // ------------------------------------------------------------
  const autoGenerateFromPantry = async () => {
    if (!household_id || !currentList) return;

    try {
      const panRes = await axiosClient.get(`/pantry/${household_id}`);
      const pantry: any[] = panRes.data.payload ?? [];

      const today = new Date();
      const soonDays = 7;
      const thresholdQty = 1;

      const existingNames = new Set(
        items
          .map((i) => (i.name ? i.name.toLowerCase() : ""))
          .filter((n) => n.length > 0)
      );

      const toAdd = pantry.filter((p) => {
        const name =
          typeof p.ingredient?.name === "string"
            ? p.ingredient.name.trim()
            : typeof p.name === "string"
            ? p.name.trim()
            : "";
        if (!name) return false;

        const qty = Number(p.quantity ?? 0);
        const lowQty = qty <= thresholdQty;

        let expSoon = false;
        if (p.expiry_date) {
          const exp = new Date(p.expiry_date);
          const diffDays =
            (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= soonDays) expSoon = true;
        }

        const isDuplicate = existingNames.has(name.toLowerCase());
        // low quantity OR expiring soon, and not already in the list
        return (lowQty || expSoon) && !isDuplicate;
      });

      for (const p of toAdd) {
        const name =
          typeof p.ingredient?.name === "string"
            ? p.ingredient.name
            : p.name;

        await axiosClient.post("/shopping-list-items/create", {
          shopping_list_id: currentList.id,
          name,
          quantity: 1,
          // here we use LOCATION as "unit" so classification sees it as pantry/manual
          unit: p.location ?? "Pantry",
        });
      }

      loadItems(currentList.id);
    } catch (err) {
      console.error("Auto-generate error:", err);
    }
  };

  // ------------------------------------------------------------
  // Generate from Meal Plan (backend does the logic)
  // ------------------------------------------------------------
  const generateFromMealPlan = async () => {
    if (!household_id || !currentList) return;

    try {
      await axiosClient.post("/shopping-lists/from-meal-plan", {
        household_id: Number(household_id),
        shopping_list_id: currentList.id,
      });

      loadItems(currentList.id);
    } catch (err) {
      console.error("Generate from meal plan error:", err);
    }
  };

  // ------------------------------------------------------------
  // ADD ITEM (manual)
  // ------------------------------------------------------------
  const handleAddItem = async (e: any) => {
    e.preventDefault();
    if (!currentList) return;

    try {
      await axiosClient.post("/shopping-list-items/create", {
        shopping_list_id: currentList.id,
        name: itemForm.name,
        quantity: normalizeQuantity(itemForm.quantity),
        // for manual items we also treat "unit" as LOCATION
        unit: itemForm.category || null,
      });

      setOpenAddItem(false);
      setItemForm({ name: "", quantity: "", category: "" });
      loadItems(currentList.id);
    } catch (err) {
      console.error("Add item error:", err);
    }
  };

  // ------------------------------------------------------------
  // EDIT ITEM
  // ------------------------------------------------------------
  const handleEditItem = async (e: any) => {
    e.preventDefault();
    if (!currentList || !selectedItem) return;

    try {
      await axiosClient.post(`/shopping-list-items/update/${selectedItem.id}`, {
        name: itemForm.name,
        quantity: normalizeQuantity(itemForm.quantity),
        unit: itemForm.category || null,
      });

      setOpenEditItem(false);
      loadItems(currentList.id);
    } catch (err) {
      console.error("Edit item error:", err);
    }
  };

  // ------------------------------------------------------------
  // DELETE ITEM
  // ------------------------------------------------------------
  const handleDeleteItem = async () => {
    if (!currentList || !selectedItem) return;

    try {
      await axiosClient.post(`/shopping-list-items/delete/${selectedItem.id}`);
      setOpenDeleteItem(false);
      loadItems(currentList.id);
    } catch (err) {
      console.error("Delete item error:", err);
    }
  };

  // ------------------------------------------------------------
  // TOGGLE BOUGHT
  // ------------------------------------------------------------
  const toggleBought = async (item: ListItem) => {
    if (!currentList) return;

    try {
      await axiosClient.post(`/shopping-list-items/toggle/${item.id}`);
      loadItems(currentList.id);
    } catch (err) {
      console.error("Toggle bought error:", err);
    }
  };

  // ------------------------------------------------------------
  // CHECKOUT BOUGHT -> PANTRY (with expiry & location)
  // ------------------------------------------------------------
  const handleCheckoutSubmit = async (e: any) => {
    e.preventDefault();
    if (!currentList) return;

    try {
      await axiosClient.post(
        `/shopping-lists/checkout-bought/${currentList.id}`,
        {
          expiry_date: checkoutForm.expiry_date || null,
          location: checkoutForm.location || null,
        }
      );

      setOpenCheckout(false);
      setCheckoutForm({ expiry_date: "", location: "" });
      loadItems(currentList.id);
    } catch (err) {
      console.error("Checkout bought error:", err);
    }
  };

  // ------------------------------------------------------------
  // SPLIT ITEMS FOR DISPLAY
  // ------------------------------------------------------------
  const { mealPlanItems, pantryItems } = splitBySource(items);
  const pantryGrouped = groupPantryByLocation(pantryItems);

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="shopping-page">
        {/* HEADER / CONTROLS */}
        <div className="shopping-header premium-header">
          <div className="title-block">
            <h1>Shopping Lists</h1>
            <p className="subtitle">
              Plan once, shop smart. Lists stay in sync with your pantry.
            </p>
          </div>

          <div className="controls-block">
            <div className="list-selector">
              <label>Active list</label>
              <select
                value={currentList?.id ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const list = lists.find((l) => l.id === id) || null;
                  setCurrentList(list);
                }}
                disabled={loadingLists || lists.length === 0}
              >
                {lists.length === 0 && <option value="">No lists</option>}
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="header-buttons">
              <button
                className="btn-secondary"
                onClick={() => {
                  if (!currentList) return;
                  setRenameValue(currentList.name);
                  setOpenRenameList(true);
                }}
                disabled={!currentList}
              >
                ✏ Rename
              </button>

              <button
                className="btn-secondary"
                onClick={() => setOpenNewList(true)}
              >
                ➕ New List
              </button>

              <button
                className="btn-primary"
                onClick={() => setOpenAddItem(true)}
                disabled={!currentList}
              >
                + Add Item
              </button>

              <button
                className="btn-secondary"
                onClick={autoGenerateFromPantry}
                disabled={!currentList}
              >
                🔄 From Pantry
              </button>

              <button
                className="btn-secondary"
                onClick={generateFromMealPlan}
                disabled={!currentList}
              >
                🍽 From Meal Plan
              </button>

              <button
                className="btn-secondary"
                onClick={() => setOpenCheckout(true)}
                disabled={!currentList}
              >
                ✅ Checkout bought → Pantry
              </button>
            </div>
          </div>
        </div>

        {/* BODY */}
        {loadingItems ? (
          <p>Loading items...</p>
        ) : !currentList ? (
          <p>No list yet. Create one to get started.</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>Your list is empty. Add items or auto-generate from your pantry.</p>
          </div>
        ) : (
          <div className="shopping-columns">
            {/* LEFT: MEAL PLAN INGREDIENTS */}
            <div className="shopping-column">
              <h2 className="section-title">Meal plan ingredients</h2>
              <p className="section-subtitle">
                These are missing ingredients for your weekly meal plan.
              </p>

              {mealPlanItems.length === 0 ? (
                <p className="empty-section">
                  Your pantry already covers the current meal plan.
                </p>
              ) : (
                <div className="mealplan-items-list">
                  {mealPlanItems.map((it) => (
                    <div
                      key={it.id}
                      className={
                        "shopping-item-row mealplan-row" +
                        (it.bought ? " bought" : "")
                      }
                    >
                      <div className="left">
                        <input
                          type="checkbox"
                          checked={it.bought}
                          onChange={() => toggleBought(it)}
                        />
                        <div className="item-text">
                          <span className="item-name">{it.name}</span>
                          <span className="item-qty">
                            {it.quantity ?? ""}{" "}
                            {it.unit && (
                              <span className="unit"> {it.unit}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="right">
                        <button
                          className="small-btn edit"
                          onClick={() => {
                            setSelectedItem(it);
                            setItemForm({
                              name: it.name,
                              quantity:
                                it.quantity === null ? "" : String(it.quantity),
                              category: it.unit ?? "",
                            });
                            setOpenEditItem(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="small-btn delete"
                          onClick={() => {
                            setSelectedItem(it);
                            setOpenDeleteItem(true);
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

            {/* RIGHT: PANTRY & MANUAL ITEMS */}
            <div className="shopping-column">
              <h2 className="section-title">Pantry & manual items</h2>
              <p className="section-subtitle">
                Items you added manually or suggested from pantry status.
              </p>

              {pantryItems.length === 0 ? (
                <p className="empty-section">
                  You have no extra pantry/manual items in this list.
                </p>
              ) : (
                <div className="shopping-grid">
                  {Object.keys(pantryGrouped).map((loc) => (
                    <div key={loc} className="category-card">
                      <div className="category-header">
                        <h3>{loc}</h3>
                      </div>

                      {pantryGrouped[loc].map((it) => (
                        <div
                          key={it.id}
                          className={
                            "shopping-item-row" + (it.bought ? " bought" : "")
                          }
                        >
                          <div className="left">
                            <input
                              type="checkbox"
                              checked={it.bought}
                              onChange={() => toggleBought(it)}
                            />
                            <div className="item-text">
                              <span className="item-name">{it.name}</span>
                              <span className="item-qty">
                                {it.quantity ?? ""}
                              </span>
                            </div>
                          </div>

                          <div className="right">
                            <button
                              className="small-btn edit"
                              onClick={() => {
                                setSelectedItem(it);
                                setItemForm({
                                  name: it.name,
                                  quantity:
                                    it.quantity === null
                                      ? ""
                                      : String(it.quantity),
                                  category: it.unit ?? "",
                                });
                                setOpenEditItem(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="small-btn delete"
                              onClick={() => {
                                setSelectedItem(it);
                                setOpenDeleteItem(true);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NEW LIST MODAL */}
      <Modal
        open={openNewList}
        onClose={() => setOpenNewList(false)}
        title="Create New Shopping List"
      >
        <form className="modal-form" onSubmit={handleCreateList}>
          <label>List name</label>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="e.g. Weekly groceries, Party prep..."
          />
          <button className="btn-primary modal-submit">Create</button>
        </form>
      </Modal>

      {/* RENAME LIST MODAL */}
      <Modal
        open={openRenameList}
        onClose={() => setOpenRenameList(false)}
        title="Rename List"
      >
        <form className="modal-form" onSubmit={renameList}>
          <label>New name</label>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            required
          />
          <button className="btn-primary modal-submit">Save</button>
        </form>
      </Modal>

      {/* ADD ITEM MODAL */}
      <Modal
        open={openAddItem}
        onClose={() => setOpenAddItem(false)}
        title="Add Item"
      >
        <form className="modal-form" onSubmit={handleAddItem}>
          <label>Name</label>
          <input
            value={itemForm.name}
            onChange={(e) =>
              setItemForm({ ...itemForm, name: e.target.value })
            }
            required
          />

          <label>Quantity</label>
          <input
            value={itemForm.quantity}
            onChange={(e) =>
              setItemForm({ ...itemForm, quantity: e.target.value })
            }
            placeholder="e.g. 2, 1.5, 6"
          />

          <label>Location</label>
          <input
            value={itemForm.category}
            onChange={(e) =>
              setItemForm({ ...itemForm, category: e.target.value })
            }
            placeholder="e.g. Fridge, Freezer, Pantry..."
          />

          <button className="btn-primary modal-submit">Add</button>
        </form>
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal
        open={openEditItem}
        onClose={() => setOpenEditItem(false)}
        title="Edit Item"
      >
        <form className="modal-form" onSubmit={handleEditItem}>
          <label>Name</label>
          <input
            value={itemForm.name}
            onChange={(e) =>
              setItemForm({ ...itemForm, name: e.target.value })
            }
            required
          />

          <label>Quantity</label>
          <input
            value={itemForm.quantity}
            onChange={(e) =>
              setItemForm({ ...itemForm, quantity: e.target.value })
            }
          />

          <label>Location</label>
          <input
            value={itemForm.category}
            onChange={(e) =>
              setItemForm({ ...itemForm, category: e.target.value })
            }
          />

          <button className="btn-primary modal-submit">Save</button>
        </form>
      </Modal>

      {/* DELETE ITEM MODAL */}
      <Modal
        open={openDeleteItem}
        onClose={() => setOpenDeleteItem(false)}
        title="Delete Item"
      >
        <p>
          Delete <strong>{selectedItem?.name}</strong> from this list?
        </p>
        <button className="btn-danger" onClick={handleDeleteItem}>
          Delete
        </button>
      </Modal>

      {/* CHECKOUT BOUGHT → PANTRY MODAL */}
      <Modal
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        title="Move bought items to pantry"
      >
        <form className="modal-form" onSubmit={handleCheckoutSubmit}>
          <label>Expiry date (optional)</label>
          <input
            type="date"
            value={checkoutForm.expiry_date}
            onChange={(e) =>
              setCheckoutForm({
                ...checkoutForm,
                expiry_date: e.target.value,
              })
            }
          />

          <label>Location (optional)</label>
          <input
            placeholder="Fridge, Freezer, Pantry..."
            value={checkoutForm.location}
            onChange={(e) =>
              setCheckoutForm({
                ...checkoutForm,
                location: e.target.value,
              })
            }
          />

          <button className="btn-primary modal-submit">Move to pantry</button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
