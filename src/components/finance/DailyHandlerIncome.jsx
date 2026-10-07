import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Banknote,
  Calendar,
  LoaderCircle,
  QrCode,
  Users,
} from "lucide-react";

import { getDailyHandlerIncome } from "../../services/financeService";
import { formatCurrency } from "../../utils/formatCurrency";
import { isToday, toDate } from "../../utils/dateHelpers";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const DailyHandlerIncome = ({
  transactions,
  loading: externalLoading = false,
  refreshKey,
}) => {
  const [apiData, setApiData] = useState(null);
  const [apiLoading, setApiLoading] = useState(
    () => !Array.isArray(transactions),
  );
  const [apiError, setApiError] = useState("");

  const todayDateString = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
    }).format(new Date());
  }, []);

  // Compute stats directly from transactions if provided
  const computedData = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return null;
    }

    const todayTransactions = transactions.filter((t) => {
      const d = toDate(t.date);
      return d && isToday(d);
    });

    const handlerMap = new Map();
    let totalAllIncome = 0;
    let totalAllIncomeTransactions = 0;
    let totalAllCashIncome = 0;
    let totalAllQrisIncome = 0;

    for (const t of todayTransactions) {
      if (t.type === "income") {
        const handlerName = t.description?.trim() || "Tanpa Nama Petugas";
        const amount = Number(t.amount) || 0;
        const method = (t.paymentMethod || "cash").toLowerCase();

        totalAllIncome += amount;
        totalAllIncomeTransactions += 1;
        if (method === "qris") {
          totalAllQrisIncome += amount;
        } else {
          totalAllCashIncome += amount;
        }

        if (!handlerMap.has(handlerName)) {
          handlerMap.set(handlerName, {
            handlerName,
            income: 0,
            cashIncome: 0,
            qrisIncome: 0,
            incomeTransactionCount: 0,
          });
        }

        const h = handlerMap.get(handlerName);
        h.income += amount;
        h.incomeTransactionCount += 1;
        if (method === "qris") {
          h.qrisIncome += amount;
        } else {
          h.cashIncome += amount;
        }
      }
    }

    const handlerList = Array.from(handlerMap.values())
      .filter((h) => h.income > 0)
      .sort((a, b) => b.income - a.income);

    return {
      handlers: handlerList,
      totalIncome: totalAllIncome,
      totalTransactions: totalAllIncomeTransactions,
      totalCashIncome: totalAllCashIncome,
      totalQrisIncome: totalAllQrisIncome,
      totalHandlers: handlerList.length,
    };
  }, [transactions]);

  // If transactions prop is not provided, fetch from backend API as fallback
  useEffect(() => {
    if (Array.isArray(transactions)) {
      return;
    }

    let cancelled = false;

    getDailyHandlerIncome()
      .then((result) => {
        if (cancelled) return;
        const fetchedHandlers = (result.handlers || []).map((h) => ({
          handlerName: h.handlerName,
          income: Number(h.income) || 0,
          cashIncome: Number(h.cashIncome) || 0,
          qrisIncome: Number(h.qrisIncome) || 0,
          incomeTransactionCount:
            Number(h.incomeTransactionCount ?? h.transactionCount) || 0,
        }));

        const totalIncome = fetchedHandlers.reduce(
          (sum, h) => sum + h.income,
          0,
        );
        const totalTransactions = fetchedHandlers.reduce(
          (sum, h) => sum + h.incomeTransactionCount,
          0,
        );
        const totalCashIncome = fetchedHandlers.reduce(
          (sum, h) => sum + h.cashIncome,
          0,
        );
        const totalQrisIncome = fetchedHandlers.reduce(
          (sum, h) => sum + h.qrisIncome,
          0,
        );

        setApiData({
          handlers: fetchedHandlers,
          totalIncome,
          totalTransactions,
          totalCashIncome,
          totalQrisIncome,
          totalHandlers: fetchedHandlers.length,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setApiError(err.message || "Gagal memuat ringkasan income petugas.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setApiLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [transactions, refreshKey]);

  const isComputed = Boolean(computedData);
  const loading = isComputed ? externalLoading : apiLoading;
  const error = isComputed ? "" : apiError;
  const data = isComputed ? computedData : apiData;

  const handlers = data?.handlers || [];
  const totalIncome = data?.totalIncome || 0;
  const totalTransactions = data?.totalTransactions || 0;
  const totalCashIncome = data?.totalCashIncome || 0;
  const totalQrisIncome = data?.totalQrisIncome || 0;
  const totalHandlers = handlers.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Total Income per Petugas
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Akumulasi pemasukan yang diperoleh oleh masing-masing petugas hari ini
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:self-auto">
          <Calendar size={14} className="text-slate-400" />
          <span>{todayDateString}</span>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex min-h-36 items-center justify-center">
            <LoaderCircle className="animate-spin text-blue-600" size={24} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : handlers.length > 0 ? (
          <div className="space-y-4">
            {/* Quick summary strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Pemasukan Petugas</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Petugas Berkontribusi</p>
                  <p className="text-lg font-bold text-slate-800">
                    {totalHandlers} Petugas
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Transaksi</p>
                  <p className="text-lg font-bold text-slate-800">
                    {totalTransactions} Transaksi
                  </p>
                </div>
              </div>

              {(totalCashIncome > 0 || totalQrisIncome > 0) && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-slate-600 border border-slate-200 shadow-2xs">
                    <Banknote size={13} className="text-emerald-600" />
                    Tunai: <strong className="text-slate-800">{formatCurrency(totalCashIncome)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-slate-600 border border-slate-200 shadow-2xs">
                    <QrCode size={13} className="text-blue-600" />
                    QRIS: <strong className="text-slate-800">{formatCurrency(totalQrisIncome)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Officer Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {handlers.map((handler, index) => {
                const percentage =
                  totalIncome > 0
                    ? ((handler.income / totalIncome) * 100).toFixed(1)
                    : "0.0";
                const isTopPerformer = index === 0 && handlers.length > 1;

                return (
                  <article
                    key={handler.handlerName}
                    className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <div>
                      {/* Officer Info & Avatar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-bold text-xs ${getAvatarColor(
                              handler.handlerName,
                            )}`}
                          >
                            {getInitials(handler.handlerName)}
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="truncate text-sm font-semibold text-slate-900"
                              title={handler.handlerName}
                            >
                              {handler.handlerName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Petugas Kasir
                            </p>
                          </div>
                        </div>

                        {isTopPerformer && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                            title="Pemasukan tertinggi hari ini"
                          >
                            <Award size={12} className="text-amber-600" />
                            Top
                          </span>
                        )}
                      </div>

                      {/* Income Value */}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500">
                          Total Income Diperoleh
                        </p>
                        <p className="mt-0.5 text-2xl font-bold tracking-tight text-emerald-600">
                          {formatCurrency(handler.income)}
                        </p>
                      </div>

                      {/* Percentage share bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Kontribusi hari ini</span>
                          <span className="font-semibold text-slate-700">
                            {percentage}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Footer */}
                    <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Frekuensi:</span>
                        <span className="font-semibold text-slate-800">
                          {handler.incomeTransactionCount} Transaksi
                        </span>
                      </div>

                      {(handler.cashIncome > 0 || handler.qrisIncome > 0) && (
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div
                            className="flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-slate-600"
                            title={`Tunai: ${formatCurrency(handler.cashIncome)}`}
                          >
                            <Banknote size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{formatCurrency(handler.cashIncome)}</span>
                          </div>
                          <div
                            className="flex items-center gap-1 rounded bg-slate-50 px-2 py-1 text-slate-600"
                            title={`QRIS: ${formatCurrency(handler.qrisIncome)}`}
                          >
                            <QrCode size={12} className="text-blue-600 shrink-0" />
                            <span className="truncate">{formatCurrency(handler.qrisIncome)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 px-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Belum Ada Pemasukan Petugas Hari Ini
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
              Belum ada transaksi income yang tercatat untuk petugas pada hari ini.
              Setiap transaksi pemasukan yang dicatat dengan nama petugas akan otomatis terangkum di sini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DailyHandlerIncome;
