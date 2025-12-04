// src/pages/Expenses/Expenses.tsx
import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import Modal from "../../components/Modal";
import DeleteModal from "../../components/DeleteModal";
import "../../styles/expenses.css";

type Expense = {
  id: number;
  household_id: number;
  amount: number;
  category: string;
  store?: string | null;
  note?: string | null;
  receipt_url?: string | null;
  date: string; // ISO YYYY-MM-DD
};

type ExpenseForm = {
  amount: string;
  category: string;
  store: string;
  date: string;
  note: string;
  receipt_url: string;
};

// Helpers ----------------------------------------------------

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(key: string): string {
  if (key === "all") return "All time";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

// Component ---------------------------------------------------

export default function ExpensesPage() {
  const household_id = localStorage.getItem("household_id");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selected, setSelected] = useState<Expense | null>(null);

  const [form, setForm] = useState<ExpenseForm>({
    amount: "",
    category: "",
    store: "",
    date: "",
    note: "",
    receipt_url: "",
  });

  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // ----------------------------------------------------------
  // Load expenses
  // ----------------------------------------------------------
  const loadExpenses = async () => {
    if (!household_id) return;

    setLoading(true);
    try {
      const res = await axiosClient.get(`/expenses/${household_id}`);
      setExpenses(res.data.payload ?? []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, [household_id]);

  // ----------------------------------------------------------
  // Derived values: month options, filtered list, totals
  // ----------------------------------------------------------
  const monthOptions = useMemo(() => {
    const keys = Array.from(
      new Set(expenses.map((e) => monthKey(e.date)))
    ).filter((k) => k !== "unknown");

    keys.sort().reverse(); // latest month first
    return keys;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    return expenses.filter((e) => monthKey(e.date) === selectedMonth);
  }, [expenses, selectedMonth]);

  const monthTotal = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const byCategory: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const key = e.category || "Other";
    byCategory[key] = (byCategory[key] || 0) + Number(e.amount || 0);
  });

  const distinctDays = new Set(filteredExpenses.map((e) => e.date)).size;
  const avgPerDay =
    distinctDays === 0 ? 0 : monthTotal / distinctDays;

  // ----------------------------------------------------------
  // Helpers for forms
  // ----------------------------------------------------------
  const resetForm = () => {
    setForm({
      amount: "",
      category: "",
      store: "",
      date: new Date().toISOString().slice(0, 10), // today
      note: "",
      receipt_url: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setSelected(null);
    setOpenAdd(true);
  };

  const openEditModal = (exp: Expense) => {
    setSelected(exp);
    setForm({
      amount: String(exp.amount),
      category: exp.category ?? "",
      store: exp.store ?? "",
      date: exp.date ?? new Date().toISOString().slice(0, 10),
      note: exp.note ?? "",
      receipt_url: exp.receipt_url ?? "",
    });
    setOpenEdit(true);
  };

  // ----------------------------------------------------------
  // Add / edit / delete
  // ----------------------------------------------------------
  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!household_id) return;

    try {
      await axiosClient.post("/expenses/create", {
        household_id: Number(household_id),
        amount: Number(form.amount),
        category: form.category.trim(),
        store: form.store.trim() || null,
        note: form.note.trim() || null,
        receipt_url: form.receipt_url.trim() || null,
        date: form.date,
      });

      setOpenAdd(false);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to create expense:", err);
    }
  };

  const handleEdit = async (e: any) => {
    e.preventDefault();
    if (!selected) return;

    try {
      await axiosClient.post(`/expenses/update/${selected.id}`, {
        amount: Number(form.amount),
        category: form.category.trim(),
        store: form.store.trim() || null,
        note: form.note.trim() || null,
        receipt_url: form.receipt_url.trim() || null,
        date: form.date,
      });

      setOpenEdit(false);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to update expense:", err);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    try {
      await axiosClient.post(`/expenses/delete/${selected.id}`);
      setOpenDelete(false);
      await loadExpenses();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <DashboardLayout>
      <div className="expenses-page">
        {/* HEADER */}
        <div className="expenses-header">
          <div>
            <h1>Budget & Expenses</h1>
            <p>
              Track what you spend on groceries and household items,
              month by month.
            </p>
          </div>

          <div className="expenses-header-right">
            <div className="month-select-wrapper">
              <label>Period</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All time</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {monthLabel(key)}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary" onClick={openAddModal}>
              + Add expense
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <section className="expenses-summary">
          <div className="summary-card main">
            <h3>
              Total{" "}
              {selectedMonth === "all"
                ? "spend"
                : `for ${monthLabel(selectedMonth)}`}
            </h3>
            <p className="summary-amount">
              {monthTotal.toFixed(2)}
              <span className="summary-currency"> </span>
            </p>
            <p className="summary-sub">
              {filteredExpenses.length} expenses tracked.
            </p>
          </div>

          <div className="summary-card">
            <h4>Average per active day</h4>
            <p className="summary-number">
              {avgPerDay.toFixed(2)}
            </p>
            <p className="summary-sub">
              Across {distinctDays || 0} day
              {distinctDays === 1 ? "" : "s"} with expenses.
            </p>
          </div>

          <div className="summary-card">
            <h4>By category</h4>
            <div className="category-chips">
              {Object.keys(byCategory).length === 0 ? (
                <span className="chip muted">No data yet</span>
              ) : (
                Object.entries(byCategory).map(([cat, total]) => (
                  <span key={cat} className="chip">
                    <span className="chip-label">{cat}</span>
                    <span className="chip-value">
                      {total.toFixed(1)}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* LIST */}
        <section className="expenses-list-section">
          <h2 className="list-title">Expenses</h2>

          {loading ? (
            <p>Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <p className="empty-note">
              No expenses in this period yet. Add your first one.
            </p>
          ) : (
            <div className="expenses-table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Store</th>
                    <th>Note</th>
                    <th className="align-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td>{exp.category}</td>
                      <td>{exp.store || "—"}</td>
                      <td className="note-cell">
                        {exp.note || "—"}
                      </td>
                      <td className="align-right amount-cell">
                        {Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="small-btn edit"
                          onClick={() => openEditModal(exp)}
                        >
                          Edit
                        </button>
                        <button
                          className="small-btn delete"
                          onClick={() => {
                            setSelected(exp);
                            setOpenDelete(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ADD MODAL */}
      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add expense"
      >
        <form className="modal-form" onSubmit={handleAdd}>
          <div className="form-row two">
            <div>
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row two">
            <div>
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="Groceries, Eating out, Household..."
                required
              />
            </div>

            <div>
              <label>Store (optional)</label>
              <input
                value={form.store}
                onChange={(e) =>
                  setForm({ ...form, store: e.target.value })
                }
                placeholder="e.g. Carrefour, Local market"
              />
            </div>
          </div>

          <label>Note (optional)</label>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) =>
              setForm({ ...form, note: e.target.value })
            }
            placeholder="Anything you want to remember about this purchase."
          />

          <label>Receipt link (optional)</label>
          <input
            value={form.receipt_url}
            onChange={(e) =>
              setForm({ ...form, receipt_url: e.target.value })
            }
            placeholder="URL to digital receipt, photo, etc."
          />

          <button className="btn-primary modal-submit">
            Save expense
          </button>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit expense"
      >
        <form className="modal-form" onSubmit={handleEdit}>
          <div className="form-row two">
            <div>
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-row two">
            <div>
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Store (optional)</label>
              <input
                value={form.store}
                onChange={(e) =>
                  setForm({ ...form, store: e.target.value })
                }
              />
            </div>
          </div>

          <label>Note (optional)</label>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) =>
              setForm({ ...form, note: e.target.value })
            }
          />

          <label>Receipt link (optional)</label>
          <input
            value={form.receipt_url}
            onChange={(e) =>
              setForm({ ...form, receipt_url: e.target.value })
            }
          />

          <button className="btn-primary modal-submit">
            Save changes
          </button>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <DeleteModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        message={
          selected
            ? `Delete expense of ${selected.amount} in category "${selected.category}"?`
            : "Delete this expense?"
        }
      />
    </DashboardLayout>
  );
}
