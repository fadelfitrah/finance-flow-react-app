import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Menu, Search, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getNotifications } from "../../services/notificationService";
import { formatCurrency } from "../../utils/formatCurrency";

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const nextNotifications = await getNotifications();
        if (!cancelled) {
          setNotifications(nextNotifications);
          setNotificationsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(error.message || "Notifikasi gagal dimuat.");
        }
      }
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Buka notifikasi"
            aria-expanded={notificationsOpen}
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div><h2 className="text-sm font-semibold text-slate-900">Notifikasi</h2><p className="text-xs text-slate-500">Pembaruan otomatis setiap menit</p></div>
                <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Tutup notifikasi" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notificationsError ? <p className="p-4 text-sm text-rose-700">{notificationsError}</p>
                  : notifications.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">Belum ada notifikasi yang perlu diperhatikan.</p>
                  : notifications.map((notification) => <article key={notification.id} className="border-b border-slate-100 p-4 last:border-0"><div className="flex gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.type === "low_stock" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}><AlertTriangle size={16} /></span><div className="min-w-0"><h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>{notification.type === "operational_expense" && <p className="mt-2 text-xs font-medium text-rose-700">{notification.time} · {formatCurrency(notification.amount)}</p>}</div></div></article>)}
              </div>
            </section>
          )}
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">Account</p>

              <p className="max-w-[180px] truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
