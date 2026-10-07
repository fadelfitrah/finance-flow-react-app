import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";

import { formatCurrency } from "../../utils/formatCurrency";

const monthlyReportSchema = z.object({
  income: z.number().finite().min(0, "Income cannot be negative."),
  expense: z.number().finite().min(0, "Expense cannot be negative."),
});

const MonthlyReportForm = ({ report, monthLabel, loading, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      income: "",
      expense: "",
    },
  });

  useEffect(() => {
    reset(
      report
        ? {
            income: Number(report.income),
            expense: Number(report.expense),
          }
        : { income: "", expense: "" },
    );
  }, [report, reset]);

  const [income, expense] = useWatch({
    control,
    name: ["income", "expense"],
  });
  const balance = (Number(income) || 0) - (Number(expense) || 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Current month report</h2>
        <p className="mt-1 text-sm text-slate-500">{monthLabel}</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-5 p-5 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="monthly-report-income"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Income
          </label>
          <input
            id="monthly-report-income"
            type="number"
            min="0"
            step="0.01"
            required
            disabled={loading}
            {...register("income", { valueAsNumber: true })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          {errors.income && (
            <p className="mt-1 text-sm text-red-600">{errors.income.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="monthly-report-expense"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Expense
          </label>
          <input
            id="monthly-report-expense"
            type="number"
            min="0"
            step="0.01"
            required
            disabled={loading}
            {...register("expense", { valueAsNumber: true })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          {errors.expense && (
            <p className="mt-1 text-sm text-red-600">
              {errors.expense.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:col-span-2">
          <p className="text-sm text-slate-600">
            Balance:{" "}
            <strong className="text-slate-900">
              {formatCurrency(balance)}
            </strong>
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {report ? "Update report" : "Save report"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default MonthlyReportForm;
