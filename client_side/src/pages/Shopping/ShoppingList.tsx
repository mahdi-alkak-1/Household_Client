import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import Modal from "../../components/Modal";
import "../../styles/shopping.css";

type ListItem = {
  id: number;
  name: string;
  quantity: string;
  category?: string;
  bought: boolean;
};

export default function ShoppingList() {
  const household_id = localStorage.getItem("household_id");

  // === Lists ===
  const [lists, setLists] = useState<any[]>([]);
  const [currentList, setCurrentList] = useState<any | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);

  // === Items ===
  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // === Modals ===
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  // === Form state for add/edit ===
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    category: "",
  });

  // ------------------------------------------------------------
  // Load shopping lists
  // ------------------------------------------------------------
  const loadLists = async () => {
    try {
      const res = await axiosClient.get(`/shopping-lists/${household_id}`);
      setLists(res.data.payload);
      // pick first list if none selected
      if (!currentList && res.data.payload.length > 0) {
        setCurrentList(res.data.payload[0]);
      }
    } catch (err) {
      console.error("Load lists error:", err);
    }
    setLoadingLists(false);
  };

  // ------------------------------------------------------------
  // Load items for the current list
  // ------------------------------------------------------------
  const loadItems = async (listId: number) => {
    setLoadingItems(true);
    try {
      const res = await axiosClient.get(`/shopping-lists/show/${listId}`);
      // assuming payload contains items array
      const loaded = res.data.payload.items || [];
      setItems(loaded);
    } catch (err) {
      console.error("Load items error:", err);
    }
    setLoadingItems(false);
  };

  // ------------------------------------------------------------
  // Initial load
  // ------------------------------------------------------------
  useEffect(() => {
    loadLists();
  }, []);

  // when current list changes, load items
  useEffect(() => {
    if (currentList) loadItems(currentList.id);
  }, [currentList]);

  // ------------------------------------------------------------
  // Create a new shopping list
  // ------------------------------------------------------------
  const createList = async () => {
    try {
      const res = await axiosClient.post("/shopping-lists/create", {
        household_id,
        name: `List ${new Date().toLocaleDateString()}`,
      });
      // reload lists and pick the new one
      await loadLists();
      const newList = res.data.payload;
      setCurrentList(newList);
    } catch (err) {
      console.error("Create list error:", err);
    }
  };

  // ------------------------------------------------------------
  // Auto-generate items from pantry shortages
  // ------------------------------------------------------------
  const autoGenerateFromPantry = async () => {
    try {
      // load pantry
      const panRes = await axiosClient.get(`/pantry/${household_id}`);
      const pantryItems: any[] = panRes.data.payload;

      const today = new Date();
      const thresholdLowQty = 1; // threshold, adjust later
      const thresholdDays = 7;   // expire within 7 days

      // find items that are low quantity or expiring soon
      const toBuy = pantryItems.filter((p) => {
        // check quantity
        const qty = Number(p.quantity ?? 0);
        const lowQty = qty <= thresholdLowQty;

        // check expiry
        let soonExpire = false;
        if (p.expires) {
          const exp = new Date(p.expires);
          const diffMs = exp.getTime() - today.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays <= thresholdDays) soonExpire = true;
        }

        return lowQty || soonExpire;
      });

      if (!currentList) {
        console.warn("No active shopping list to add items to.");
        return;
      }

      // add each to list
      for (const p of toBuy) {
        await axiosClient.post("/shopping-list-items/create", {
          shopping_list_id: currentList.id,
          name: p.name,
          quantity: 1, // default, user can edit
          category: p.unit ?? "Pantry", // simple default
        });
      }

      // reload items
      loadItems(currentList.id);
    } catch (err) {
      console.error("Auto-generate error:", err);
    }
  };

  // ------------------------------------------------------------
  // Add item
  // ------------------------------------------------------------
  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!currentList) return;

    await axiosClient.post("/shopping-list-items/create", {
      shopping_list_id: currentList.id,
      name: form.name,
      quantity: form.quantity,
      category: form.category,
    });

    setOpenAdd(false);
    setForm({ name: "", quantity: "", category: "" });
    loadItems(currentList.id);
  };

  // ------------------------------------------------------------
  // Edit item
  // ------------------------------------------------------------
  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selectedItem) return;

    await axiosClient.post(`/shopping-list-items/update/${selectedItem.id}`, {
      name: form.name,
      quantity: form.quantity,
      category: form.category,
    });

    setOpenEdit(false);
    loadItems(currentList!.id);
  };

  // ------------------------------------------------------------
  // Delete item
  // ------------------------------------------------------------
  const handleDelete = async () => {
    if (!selectedItem) return;

    await axiosClient.post(`/shopping-list-items/delete/${selectedItem.id}`);
    setOpenDelete(false);
    loadItems(currentList!.id);
  };

  // ------------------------------------------------------------
  // Toggle bought
  // ------------------------------------------------------------
  const toggleBought = async (item: ListItem) => {
    await axiosClient.post(`/shopping-list-items/toggle/${item.id}`);
    loadItems(currentList!.id);
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="shopping-header">
        <h1>Shopping List</h1>

        {/* choose list */}
        <select
          value={currentList?.id ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const list = lists.find((l) => l.id === id);
            if (list) setCurrentList(list);
          }}
          disabled={loadingLists}
        >
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button className="btn-primary" onClick={() => setOpenAdd(true)}>
          + Add Item
        </button>

        <button className="btn-secondary" onClick={autoGenerateFromPantry}>
          🔄 Auto‑generate
        </button>

        <button className="btn-secondary" onClick={createList}>
          ➕ New List
        </button>
      </div>

      {loadingItems ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items in this list.</p>
      ) : (
        <div className="shopping-items">
          {items.map((it) => (
            <div key={it.id} className="shopping-item">
              <input
                type="checkbox"
                checked={it.bought}
                onChange={() => toggleBought(it)}
              />
              <span style={{ textDecoration: it.bought ? "line-through" : "none" }}>
                {it.name} — {it.quantity} {it.category ? `(${it.category})` : ""}
              </span>

              <button
                className="small-btn edit"
                onClick={() => {
                  setSelectedItem(it);
                  setForm({
                    name: it.name,
                    quantity: it.quantity,
                    category: it.category ?? "",
                  });
                  setOpenEdit(true);
                }}
              >
                Edit
              </button>

              <button
                className="small-btn delete"
                onClick={() => {
                  setSelectedItem(it);
                  setOpenDelete(true);
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* -----------------------------------------------------
          ADD ITEM MODAL
      ----------------------------------------------------- */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add Item">
        <form className="modal-form" onSubmit={handleAdd}>
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Quantity</label>
          <input
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />

          <label>Category</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <button className="btn-primary modal-submit">Add</button>
        </form>
      </Modal>

      {/* -----------------------------------------------------
          EDIT ITEM MODAL
      ----------------------------------------------------- */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Item">
        <form className="modal-form" onSubmit={handleEdit}>
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Quantity</label>
          <input
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />

          <label>Category</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <button className="btn-primary modal-submit">Save</button>
        </form>
      </Modal>

      {/* -----------------------------------------------------
          DELETE ITEM MODAL
      ----------------------------------------------------- */}
      <Modal open={openDelete} onClose={() => setOpenDelete(false)} title="Delete Item">
        <p>
          Delete <strong>{selectedItem?.name}</strong>?
        </p>

        <button className="btn-danger" onClick={handleDelete}>
          Delete
        </button>
      </Modal>
    </DashboardLayout>
  );
}
