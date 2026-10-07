import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

import DashboardLayout from "../layouts/DashboardLayout";
import Finance from "../pages/Finance";
import Inventory from "../pages/Inventory";
import AIAnalysis from "../pages/AIAnalysis";
import InventoryAIAnalysis from "../pages/InventoryAIAnalysis";
import Settings from "../pages/Settings";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/finance" element={<Finance />} />

            <Route path="/finance/daily" element={<Finance />} />

            <Route path="/finance/weekly" element={<Finance />} />

            <Route path="/finance/monthly" element={<Finance />} />

            <Route path="/inventory" element={<Inventory />} />

            <Route path="/ai-analysis" element={<AIAnalysis />} />

            <Route
              path="/ai-inventory-analysis"
              element={<InventoryAIAnalysis />}
            />

            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
