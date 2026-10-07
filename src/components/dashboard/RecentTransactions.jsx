import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatCurrency } from "../../utils/formatCurrency";

const RecentTransactions = ({ transactions, loading }) => {
  if (loading) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <EmptyState
          title="No transactions yet"
          description="Your recent financial transactions will appear here."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">Recent Transactions</h2>

        <p className="mt-1 text-sm text-slate-500">Latest financial activity</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Description
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Category
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Type
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Amount
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.slice(0, 5).map((transaction) => {
              const isIncome = transaction.type === "income";

              return (
                <tr key={transaction.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {transaction.description}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500">
                    {transaction.category}
                  </td>

                  <td className="px-5 py-4">
                    <div
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
                    </div>
                  </td>

                  <td
                    className={`px-5 py-4 text-right font-semibold ${
                      isIncome ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
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

export default RecentTransactions;
