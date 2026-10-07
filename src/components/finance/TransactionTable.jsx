import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
  LockKeyhole,
  Trash2,
} from "lucide-react";

import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatCurrency";
import { toDate } from "../../utils/dateHelpers";

const TransactionTable = ({ transactions, loading, onEdit, onDelete }) => {
  const today = new Date();
  const currentPeriod = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <EmptyState
          title="No transactions found"
          description="Try adding a transaction or changing your filters."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Date
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Petugas
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Category
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Jumlah Barang
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Type
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Metode Pembayaran
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Amount
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const isArchived =
                String(transaction.date).slice(0, 7) < currentPeriod;

              const date = toDate(transaction.date);

              return (
                <tr
                  key={transaction.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {date?.toLocaleDateString("id-ID")}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {transaction.description}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    <p>{transaction.category}</p>
                    {transaction.categoryDetail && (
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.categoryDetail}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right text-sm text-slate-500">
                    {transaction.category === "Barang"
                      ? transaction.quantity
                      : "-"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}

                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm capitalize text-slate-600">
                    {transaction.paymentMethod || "cash"}
                  </td>

                  <td
                    className={`px-5 py-4 text-right font-semibold ${
                      isIncome ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(transaction.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {isArchived ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 text-xs text-slate-500"
                          title="Transactions from completed months are read-only"
                        >
                          <LockKeyhole size={15} />
                          Read only
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => onEdit(transaction)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => onDelete(transaction)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
