import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  X,
  Settings,
  WalletCards,
} from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { logout } = useAuth();

  const [financeOpen, setFinanceOpen] = useState(false);

  const mainNavigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Inventory",
      path: "/inventory",
      icon: Boxes,
    },
    {
      label: "Analisis keuangan AI",
      path: "/ai-analysis",
      icon: BrainCircuit,
    },
    {
      label: "Analisis modal & pemasukan",
      path: "/ai-inventory-analysis",
      icon: BarChart3,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const navigationLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`;

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:z-40 lg:block lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b border-slate-800 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <WalletCards size={21} />
              </div>

              <div>
                <h1 className="font-bold">FinanceFlow</h1>

                <p className="text-sm text-slate-500">
                  AI Management System for Finance and Inventory
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white lg:hidden"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 p-4">
            <NavLink
              to="/dashboard"
              className={navigationLinkClass}
              onClick={onClose}
            >
              <LayoutDashboard size={21} />
              Dashboard
            </NavLink>

            <div>
              <button
                onClick={() => setFinanceOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <BarChart3 size={18} />
                  Finance Management
                </span>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${financeOpen ? "rotate-180" : ""}`}
                />
              </button>

              {financeOpen && (
                <div className="ml-4 mt-1 space-y-1 borde-1 border-slate-800 pl-3">
                  <NavLink
                    to="/finance/daily"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"}`
                    }
                    onClick={onClose}
                  >
                    Daily
                  </NavLink>

                  <NavLink
                    to="/finance/weekly"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-slate-800 twxt-white" : "text-slate-500 hover:text-white"}`
                    }
                    onClick={onClose}
                  >
                    Weekly
                  </NavLink>

                  <NavLink
                    to="/finance/monthly"
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-slate-500 hover:text-white"
                      }`
                    }
                    onClick={onClose}
                  >
                    Monthly
                  </NavLink>
                </div>
              )}
            </div>

            {mainNavigation.slice(1).map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navigationLinkClass}
                  onClick={onClose}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
