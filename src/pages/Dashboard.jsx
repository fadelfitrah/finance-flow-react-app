import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  QrCode,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../components/dashboard/StatCard";
import FinancialChart from "../components/dashboard/FinancialChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";

import { useAuth } from "../hooks/useAuth";
import { useTransactions } from "../hooks/useTransactions";

import {
  calculateBalance,
  calculateTotalExpense,
  calculateTotalIncome,
} from "../utils/calculations";

import { formatCurrency } from "../utils/formatCurrency";
import { toDate } from "../utils/dateHelpers";

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const transactionDateKey = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = toDate(value);
  return date ? formatDateInput(date) : null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const defaultDashboardView = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("financeflow_preferences") || "{}",
      ).defaultDashboardView || "overview";
    } catch {
      return "overview";
    }
  })[0];

  const { transactions, loading, error } = useTransactions(user?.uid, 50);
  const [period, setPeriod] = useState(
    defaultDashboardView === "finance" ? "monthly" : "daily",
  );
  const [showMoreStats, setShowMoreStats] = useState(
    defaultDashboardView === "inventory",
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateInput(new Date()),
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    formatDateInput(new Date()).slice(0, 7),
  );
  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const selectedTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const dateKey = transactionDateKey(transaction.date);

        return period === "daily"
          ? dateKey === selectedDate
          : dateKey?.startsWith(selectedMonth);
      }),
    [transactions, period, selectedDate, selectedMonth],
  );
  const income = calculateTotalIncome(selectedTransactions);
  const cashIncome = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" &&
        (transaction.paymentMethod || "cash") === "cash",
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const qrisIncome = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "income" && transaction.paymentMethod === "qris",
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const expense = calculateTotalExpense(selectedTransactions);
  const operationalExpense = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        ["Operasional", "Operasional Toko", "Lain-lain"].includes(
          transaction.category,
        ),
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const restockExpense = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.category === "Restock",
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const balance = calculateBalance(selectedTransactions);
  const periodLabel = period === "daily" ? "Daily" : "Monthly";
  const selectedPeriodDescription =
    period === "daily"
      ? `on ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${selectedDate}T00:00:00`))}`
      : `in ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${selectedMonth}-01T00:00:00`))}`;

  const chartData = useMemo(() => {
    const [year, month, day] =
      period === "daily"
        ? selectedDate.split("-")
        : `${selectedMonth}-01`.split("-");
    const yearNumber = Number(year);
    const monthNumber = Number(month);
    const daysInPeriod =
      period === "daily" ? 1 : new Date(yearNumber, monthNumber, 0).getDate();
    const totals = Array.from({ length: daysInPeriod }, (_, index) => {
      const date =
        period === "daily"
          ? new Date(yearNumber, monthNumber - 1, Number(day))
          : new Date(yearNumber, monthNumber - 1, index + 1);
      const dateKey = formatDateInput(date);

      return {
        date,
        dateKey,
        name:
          period === "daily"
            ? date.toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : String(date.getDate()),
        income: 0,
        expense: 0,
      };
    });

    const totalsByDate = new Map(totals.map((item) => [item.dateKey, item]));

    selectedTransactions.forEach((transaction) => {
      const dateKey = transactionDateKey(transaction.date);
      const total = totalsByDate.get(dateKey);

      if (total) {
        total[transaction.type] += Number(transaction.amount || 0);
      }
    });

    return totals;
  }, [period, selectedDate, selectedMonth, selectedTransactions]);

  return (
    <div className="flex-1 space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Overview</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Financial Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor your financial performance and business activity.
        </p>

        <p className="mt-2 text-sm font-medium capitalize text-slate-700">
          {todayLabel}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Data transaksi tidak dapat dimuat. Pastikan API dan MySQL sedang
          berjalan, lalu coba muat ulang halaman.
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor="dashboard-period"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Financial period
          </label>
          <select
            id="dashboard-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-48"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {period === "daily" ? (
          <div>
            <label
              htmlFor="dashboard-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select date
            </label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value || formatDateInput(new Date()),
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="dashboard-month"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Select month
            </label>
            <input
              id="dashboard-month"
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(
                  event.target.value || formatDateInput(new Date()).slice(0, 7),
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 sm:w-56"
            />
          </div>
        )}
      </section>

      <section
        id="dashboard-statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatCard
          title={`${periodLabel} Income`}
          value={formatCurrency(income)}
          icon={ArrowUpRight}
          description={`Income recorded ${selectedPeriodDescription}`}
          trendType="positive"
        />

        <StatCard
          title={`${periodLabel} Expense`}
          value={formatCurrency(expense)}
          icon={ArrowDownRight}
          description={`Expenses recorded ${selectedPeriodDescription}`}
          trendType="negative"
        />

        <StatCard
          title={`${periodLabel} Balance`}
          value={formatCurrency(balance)}
          icon={Wallet}
          description="Income minus expenses for selected period"
          trendType={balance >= 0 ? "positive" : "negative"}
        />

        {showMoreStats && (
          <>
            <StatCard
              title={`${periodLabel} Operasional`}
              value={formatCurrency(operationalExpense)}
              icon={ArrowDownRight}
              description="Pengeluaran kategori operasional"
              trendType="negative"
            />

            <StatCard
              title={`${periodLabel} Restock`}
              value={formatCurrency(restockExpense)}
              icon={PlusCircle}
              description="Pengeluaran untuk penambahan stok"
              trendType="negative"
            />

            <StatCard
              title={`${periodLabel} Transactions`}
              value={selectedTransactions.length}
              icon={Wallet}
              description="Transactions in selected period"
            />
          </>
        )}
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMoreStats((isExpanded) => !isExpanded)}
          aria-expanded={showMoreStats}
          aria-controls="dashboard-statistics"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {showMoreStats ? "View Less" : "View More"}
          {showMoreStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <section>
        <FinancialChart
          data={chartData}
          description={
            period === "daily"
              ? `Income and expenses ${selectedPeriodDescription}`
              : `Daily income and expenses ${selectedPeriodDescription}`
          }
        />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Banknote size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Income Cash</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
              {formatCurrency(cashIncome)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <QrCode size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Income QRIS</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
              {formatCurrency(qrisIncome)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Dashboard memuat maksimal 50 transaksi terbaru.
          </p>
          <Link
            to="/finance/daily"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Detail transaksi
            <ArrowRight size={16} />
          </Link>
        </div>
        <RecentTransactions
          transactions={selectedTransactions}
          loading={loading}
        />
      </section>
    </div>
  );
};

export default Dashboard;
