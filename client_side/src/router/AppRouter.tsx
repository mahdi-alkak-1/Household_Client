import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import SelectHousehold from "../pages/Households/SelectHousehold";
import Pantry from "../pages/Pantry/Pantry";
import Recipes from "../pages/Recipes/Recipes";
import ShoppingList from "../pages/Shopping/ShoppingList";
import Profile from "../pages/Profile/Profile";
import Ingredients from "../pages/Ingredients/Ingredients";
import MealPlan from "../pages/MealPlan/MealPlan";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-household" element={<SelectHousehold />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/meal-plan" element={<MealPlan />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}
