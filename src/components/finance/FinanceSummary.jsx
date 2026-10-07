import { ArrowDownRight, ArrowUpRight, Scale, Wallet } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  calculateBalance,
  calculateTotalExpense,
  calculateTotalIncome,
} from "../../utils/calculations";

const FinanceSummary = ({ transactions = [] }) => {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpense = calculateTotalExpense(transactions);
  const balance = calculateBalance(transactions);

  const incomeCount = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Income */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Pemasukan</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(totalIncome)}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowUpRight size={22} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {incomeCount} transaksi pemasukan
        </p>
      </div>

      {/* Total Expense */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Pengeluaran</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-red-600">
              {formatCurrency(totalExpense)}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ArrowDownRight size={22} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {expenseCount} transaksi pengeluaran
        </p>
      </div>

      {/* Net Balance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:col-span-2 lg:col-span-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Sisa Saldo</p>
            <h3
              className={`mt-2 text-2xl font-bold tracking-tight ${
                balance >= 0 ? "text-slate-900" : "text-red-600"
              }`}
            >
              {formatCurrency(balance)}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {balance >= 0 ? <Wallet size={22} /> : <Scale size={22} />}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {balance > 0
            ? "Surplus keuangan periode ini"
            : balance < 0
              ? "Defisit keuangan periode ini"
              : "Saldo seimbang"}
        </p>
      </div>
    </div>
  );
};

export default FinanceSummary;
