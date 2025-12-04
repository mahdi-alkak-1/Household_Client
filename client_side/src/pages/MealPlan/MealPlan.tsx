import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import "../../styles/MealPlan.css";

type Recipe = {
  id: number;
  title: string;
};

type MealPlanItem = {
  id: number;
  date: string; // "YYYY-MM-DD"
  slot: "breakfast" | "lunch" | "dinner";
  recipe_id: number | null;
  recipe?: Recipe | null;
};

type MealPlan = {
  id: number;
  household_id: number;
  week_start_date: string; // "YYYY-MM-DD"
  items: MealPlanItem[];
};

const SLOTS: ("breakfast" | "lunch" | "dinner")[] = [
  "breakfast",
  "lunch",
  "dinner",
];

// helper: format JS Date -> "YYYY-MM-DD"
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// helper: get Monday of the week for a given date
function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// build 7 days from week_start_date
function buildWeekDays(weekStart: string) {
  const base = new Date(weekStart);
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      date: formatDate(d),
      label: `${names[i]} ${d.getDate()}`,
    };
  });
}

export default function MealPlanPage() {
  const household_id = localStorage.getItem("household_id");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // current week's Monday in "YYYY-MM-DD"
  const [weekStart, setWeekStart] = useState(() =>
    formatDate(getWeekStartMonday(new Date()))
  );

  // ------------------------------------------------------------
  // Load recipes for this household
  // ------------------------------------------------------------
  const loadRecipes = async () => {
    if (!household_id) return;
    try {
      const res = await axiosClient.get(`/recipes/${household_id}`);
      setRecipes(res.data.payload ?? []);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    }
  };

  // ------------------------------------------------------------
  // Ensure we have a meal plan for this week:
  //  - GET /meal-plans/{household_id}
  //  - if plan.week_start_date == weekStart => use that
  //  - else POST /meal-plans/create
  //  - then GET /meal-plans/show/{id} (which auto-creates 7×3 items)
  // ------------------------------------------------------------
  const ensurePlanForWeek = async () => {
    if (!household_id) return;

    setLoading(true);

    try {
      const listRes = await axiosClient.get(`/meal-plans/${household_id}`);
      const plans: MealPlan[] = listRes.data.payload ?? [];

      let plan = plans.find((p) => p.week_start_date === weekStart);

      if (!plan) {
        const createRes = await axiosClient.post("/meal-plans/create", {
          household_id: Number(household_id),
          week_start_date: weekStart,
        });
        plan = createRes.data.payload;
      }

      const showRes = await axiosClient.get(`/meal-plans/show/${plan.id}`);
      setMealPlan(showRes.data.payload);
    } catch (err) {
      console.error("Failed to ensure meal plan:", err);
    }

    setLoading(false);
  };

  // load recipes once
  useEffect(() => {
    loadRecipes();
  }, [household_id]);

  // load or create plan whenever weekStart changes
  useEffect(() => {
    ensurePlanForWeek();
  }, [household_id, weekStart]);

  // ------------------------------------------------------------
  // Update a single slot (change recipe)
  // ------------------------------------------------------------
  const updateSlotRecipe = async (item: MealPlanItem, recipeIdStr: string) => {
    const recipe_id = recipeIdStr ? Number(recipeIdStr) : null;

    try {
      await axiosClient.post(`/meal-plan-items/update/${item.id}`, {
        recipe_id,
      });

      if (mealPlan) {
        const showRes = await axiosClient.get(
          `/meal-plans/show/${mealPlan.id}`
        );
        setMealPlan(showRes.data.payload);
      }
    } catch (err) {
      console.error("Failed to update meal slot:", err);
    }
  };

  // ------------------------------------------------------------
  // Week navigation
  // ------------------------------------------------------------
  const changeWeek = (deltaDays: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    const newWeekStart = formatDate(getWeekStartMonday(d));
    setWeekStart(newWeekStart);
  };

  // ------------------------------------------------------------
  // Build a lookup: { [date_slot_key]: MealPlanItem }
  // ------------------------------------------------------------
  const itemByDaySlot: Record<string, MealPlanItem> = {};
  if (mealPlan?.items) {
    for (const it of mealPlan.items) {
      const key = `${it.date}__${it.slot}`;
      itemByDaySlot[key] = it;
    }
  }

  const days = buildWeekDays(weekStart);

  if (!household_id) {
    return (
      <DashboardLayout>
        <p>Please select a household first.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mealplan-header">
        <h1>Weekly Meal Plan</h1>

        <div className="week-controls">
          <button onClick={() => changeWeek(-7)}>⬅ Previous week</button>
          <span>Week of {weekStart}</span>
          <button onClick={() => changeWeek(7)}>Next week ➡</button>
        </div>
      </div>

      {loading || !mealPlan ? (
        <p>Loading meal plan...</p>
      ) : (
        <div className="mealplan-grid-container">
          <table className="mealplan-grid">
            <thead>
              <tr>
                <th>Meal</th>
                {days.map((d) => (
                  <th key={d.date}>{d.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <td className="slot-label">
                    {slot.charAt(0).toUpperCase() + slot.slice(1)}
                  </td>

                  {days.map((d) => {
                    const key = `${d.date}__${slot}`;
                    const cellItem = itemByDaySlot[key];

                    return (
                      <td key={key}>
                        {cellItem ? (
                          <select
                            value={cellItem.recipe_id ?? ""}
                            onChange={(e) =>
                              updateSlotRecipe(cellItem, e.target.value)
                            }
                          >
                            <option value="">— No recipe —</option>
                            {recipes.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="empty-slot">No slot</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mealplan-hint">
            Create recipes in the <strong>Recipes</strong> page, then come here
            and assign them to each day & meal.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
