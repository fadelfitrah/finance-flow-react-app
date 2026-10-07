import { useEffect, useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useTransactions } from "../hooks/useTransactions";
import {
  getMonthlyFinancialReports,
  saveMonthlyReport,
} from "../services/financeService";

import FinanceSummary from "../components/finance/FinanceSummary";
import DailyHandlerIncome from "../components/finance/DailyHandlerIncome";
import TransactionFilters from "../components/finance/TransactionFilters";
import TransactionTable from "../components/finance/TransactionTable";
import TransactionForm from "../components/finance/TransactionForm";
import MonthlyReportForm from "../components/finance/MonthlyReportForm";

import Modal from "../components/common/Modal";
import ConfirmationDialog from "../components/common/ConfirmationDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";

import { isThisMonth, isThisWeek, isToday, toDate } from "../utils/dateHelpers";

import { exportTransactionsToCSV } from "../utils/exportCsv";
import { formatCurrency } from "../utils/formatCurrency";

const Finance = () => {
  const { user } = useAuth();

  const location = useLocation();

  const {
    transactions,
    loading,
    error,
    addTransaction,
    editTransaction,
    removeTransaction,
  } = useTransactions(user?.uid);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");

  const [formOpen, setFormOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState(null);

  const [deletingTransaction, setDeletingTransaction] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [monthlyReportsLoading, setMonthlyReportsLoading] = useState(true);
  const [monthlyReportsError, setMonthlyReportsError] = useState(false);
  const now = new Date();
  const currentPeriodKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const currentMonthReport = monthlyReports.find(
    (report) => report.period === currentPeriodKey,
  );
  const currentMonthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(now);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let cancelled = false;
    getMonthlyFinancialReports()
      .then((reports) => {
        if (!cancelled) {
          setMonthlyReports(reports);
        }
      })
      .catch((reportError) => {
        console.error("Fetch monthly reports error:", reportError);
        if (!cancelled) {
          setMonthlyReportsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMonthlyReportsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const period = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.includes("/finance/daily")) {
      return "daily";
    }

    if (pathname.includes("/finance/weekly")) {
      return "weekly";
    }

    if (pathname.includes("/finance/monthly")) {
      return "monthly";
    }

    return "all";
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    switch (period) {
      case "daily":
        return "Daily Transactions";

      case "weekly":
        return "Weekly Transactions";

      case "monthly":
        return "Monthly Financial Reports";

      default:
        return "Transactions";
    }
  }, [period]);

  const pageDescription = useMemo(() => {
    switch (period) {
      case "daily":
        return "Monitor your financial activity for today.";

      case "weekly":
        return "Monitor your financial activity for the current week.";

      case "monthly":
        return "Create this month's report and review archived monthly summaries.";

      default:
        return "Manage and monitor all your financial transactions.";
    }
  }, [period]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      let periodMatch = true;

      if (period !== "all") {
        const transactionDate = toDate(transaction.date);

        if (!transactionDate) {
          return false;
        }

        if (period === "daily") {
          periodMatch = isToday(transactionDate);
        }

        if (period === "weekly") {
          periodMatch = isThisWeek(transactionDate);
        }

        if (period === "monthly") {
          periodMatch = isThisMonth(transactionDate);
        }
      }

      const searchValue = search.trim().toLowerCase();

      const description = transaction.description?.toLowerCase() || "";

      const transactionCategory = transaction.category?.toLowerCase() || "";

      const searchMatch =
        searchValue === "" ||
        description.includes(searchValue) ||
        transactionCategory.includes(searchValue);

      const typeMatch = type === "all" || transaction.type === type;

      const categoryMatch =
        category === "all" || transaction.category === category;

      return periodMatch && searchMatch && typeMatch && categoryMatch;
    });
  }, [transactions, period, search, type, category]);

  const handleCreate = async (data) => {
    try {
      setActionLoading(true);

      await addTransaction(data);

      toast.success("Transaction added successfully.");

      setFormOpen(false);
    } catch (err) {
      console.error("Create transaction error:", err);

      toast.error("Failed to add transaction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    if (!editingTransaction) {
      return;
    }

    try {
      setActionLoading(true);

      await editTransaction(editingTransaction.id, data);

      toast.success("Transaction updated successfully.");

      setEditingTransaction(null);
    } catch (err) {
      console.error("Update transaction error:", err);

      toast.error("Failed to update transaction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) {
      return;
    }

    try {
      setActionLoading(true);

      await removeTransaction(deletingTransaction.id);

      toast.success("Transaction deleted successfully.");

      setDeletingTransaction(null);
    } catch (err) {
      console.error("Delete transaction error:", err);

      toast.error("Failed to delete transaction.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMonthlyReport = async (data) => {
    const today = new Date();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();

    if (today.getDate() !== lastDayOfMonth) {
      toast.error(
        "Monthly reports can only be submitted on the last day of the month.",
      );
      return;
    }

    try {
      setActionLoading(true);
      await saveMonthlyReport(data);
      const reports = await getMonthlyFinancialReports();
      setMonthlyReports(reports);
      setMonthlyReportsError(false);
      toast.success("Monthly report saved successfully.");
    } catch (reportError) {
      console.error("Save monthly report error:", reportError);
      toast.error(
        reportError.code === "month-end-required"
          ? reportError.message
          : "Failed to save monthly report.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleCloseCreate = () => {
    if (actionLoading) {
      return;
    }

    setFormOpen(false);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCloseEdit = () => {
    if (actionLoading) {
      return;
    }

    setEditingTransaction(null);
  };

  const handleDeleteRequest = (transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleCancelDelete = () => {
    if (actionLoading) {
      return;
    }

    setDeletingTransaction(null);
  };

  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      toast.error("There are no transactions to export.");

      return;
    }

    try {
      const filename =
        period === "all"
          ? "finance-transactions.csv"
          : `finance-${period}-transactions.csv`;

      exportTransactionsToCSV(filteredTransactions, filename);

      toast.success("Transactions exported successfully.");
    } catch (err) {
      console.error("CSV export error:", err);

      toast.error("Failed to export transactions.");
    }
  };

  if (error && period !== "monthly") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Financial Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {pageTitle}
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Unable to load transactions
          </h2>

          <p className="mt-2 text-sm text-red-600">
            Something went wrong while loading your financial records.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Financial Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {pageTitle}
          </h1>

          <p className="mt-2 text-sm text-slate-500">{pageDescription}</p>
        </div>

        {period !== "monthly" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleExportCSV}
              disabled={loading || filteredTransactions.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <Plus size={18} />
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {period === "monthly" ? (
        <>
          <MonthlyReportForm
            report={currentMonthReport}
            monthLabel={currentMonthLabel}
            loading={actionLoading || monthlyReportsLoading}
            onSubmit={handleSaveMonthlyReport}
          />

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Monthly reports</h2>
              <p className="mt-1 text-sm text-slate-500">
                Saved report for this month and archived monthly summaries.
              </p>
            </div>
            {monthlyReports.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                        Month
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Income
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Expense
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Balance
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyReports.map((report) => (
                      <tr key={report.period}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-800">
                          {new Intl.DateTimeFormat("id-ID", {
                            month: "long",
                            year: "numeric",
                            timeZone: "UTC",
                          }).format(new Date(`${report.period}-01T00:00:00Z`))}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-emerald-700">
                          {formatCurrency(report.income)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-red-700">
                          {formatCurrency(report.expense)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(report.balance)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-slate-600">
                          {report.transactionCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                {monthlyReportsLoading ? (
                  <div className="flex min-h-48 items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : monthlyReportsError ? (
                  <EmptyState
                    title="Unable to load monthly reports"
                    description="Check your connection and try again."
                  />
                ) : (
                  <EmptyState
                    title="No saved monthly reports"
                    description="Save this month's report above to get started."
                  />
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <FinanceSummary transactions={filteredTransactions} />

          {period === "daily" && (
            <DailyHandlerIncome
              transactions={transactions}
              loading={loading}
              refreshKey={transactions}
            />
          )}

          <TransactionFilters
            search={search}
            setSearch={setSearch}
            type={type}
            setType={setType}
            category={category}
            setCategory={setCategory}
          />

          <TransactionTable
            transactions={filteredTransactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={handleCloseCreate}
        title="Add Transaction"
      >
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreate}
          loading={actionLoading}
        />
      </Modal>

      <Modal
        open={Boolean(editingTransaction)}
        onClose={handleCloseEdit}
        title="Edit Transaction"
      >
        <TransactionForm
          initialData={editingTransaction}
          onSubmit={handleUpdate}
          onCancel={handleCloseEdit}
          loading={actionLoading}
        />
      </Modal>

      <ConfirmationDialog
        open={Boolean(deletingTransaction)}
        onCancel={handleCancelDelete}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete this transaction?"
        description={
          deletingTransaction
            ? `The transaction "${deletingTransaction.description}" will be permanently removed from your financial records.`
            : "This transaction will be permanently removed from your financial records."
        }
      />
    </div>
  );
};

export default Finance;
