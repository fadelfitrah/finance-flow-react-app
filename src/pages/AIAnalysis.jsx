import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyzeMonthlyFinancialReport } from "../services/aiService";
import { getMonthlyFinancialReports } from "../services/financeService";
import { formatCurrency } from "../utils/formatCurrency";

const formatPeriod = (period, options = { month: "long", year: "numeric" }) =>
  new Intl.DateTimeFormat("id-ID", options).format(
    new Date(`${period}-01T00:00:00`),
  );

const healthStyles = {
  sehat: {
    label: "Kondisi sehat",
    className: "bg-emerald-50 text-emerald-700",
    icon: ShieldCheck,
  },
  perlu_diperhatikan: {
    label: "Perlu perhatian",
    className: "bg-amber-50 text-amber-700",
    icon: AlertTriangle,
  },
  kritis: {
    label: "Kondisi kritis",
    className: "bg-rose-50 text-rose-700",
    icon: AlertTriangle,
  },
};

const toneStyles = {
  positive: "border-emerald-500",
  caution: "border-amber-500",
  negative: "border-rose-500",
};

const priorityStyles = {
  tinggi: "bg-rose-50 text-rose-700",
  menengah: "bg-amber-50 text-amber-700",
  rendah: "bg-slate-100 text-slate-600",
};

const FinancialMetric = ({ title, value, detail, icon: Icon, color }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 break-words text-xl font-semibold text-slate-900 sm:text-2xl">
          {value}
        </p>
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        <Icon size={19} />
      </span>
    </div>
  </article>
);

const AIAnalysis = () => {
  const [reports, setReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMonthlyFinancialReports()
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        if (data.length) setSelectedPeriod(data[0].period);
      })
      .catch((error) => {
        if (!cancelled) {
          setReportsError(error.message || "Laporan bulanan gagal dimuat.");
        }
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIndex = reports.findIndex(
    (report) => report.period === selectedPeriod,
  );
  const selectedReport = selectedIndex >= 0 ? reports[selectedIndex] : null;
  const previousReport = selectedIndex >= 0 ? reports[selectedIndex + 1] : null;
  const income = Number(selectedReport?.income || 0);
  const expense = Number(selectedReport?.expense || 0);
  const balance = Number(selectedReport?.balance ?? income - expense);
  const margin = income > 0 ? `${((balance / income) * 100).toFixed(1)}%` : "-";

  const chartData = reports
    .filter((report) => report.period <= selectedPeriod)
    .slice(0, 6)
    .reverse()
    .map((report) => ({
      period: report.period,
      label: formatPeriod(report.period, { month: "short" }),
      income: Number(report.income),
      expense: Number(report.expense),
    }));

  const compareWithPrevious = (field, lowerIsBetter = false) => {
    if (!previousReport) return "Belum ada data pembanding";
    const currentValue = Number(selectedReport[field] || 0);
    const previousValue = Number(previousReport[field] || 0);
    const change = currentValue - previousValue;
    if (change === 0) return "Sama dengan bulan sebelumnya";
    const improved = lowerIsBetter ? change < 0 : change > 0;
    const Icon = change > 0 ? ArrowUpRight : ArrowDownRight;
    return (
      <span
        className={`inline-flex items-center gap-1 ${improved ? "text-emerald-700" : "text-rose-700"}`}
      >
        <Icon size={14} />
        {formatCurrency(Math.abs(change))} dari bulan lalu
      </span>
    );
  };

  const runAnalysis = async () => {
    if (!selectedPeriod) return;
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    try {
      setAnalysis(await analyzeMonthlyFinancialReport(selectedPeriod));
    } catch (error) {
      setAnalysisError(error.message || "Analisis gagal dijalankan.");
    } finally {
      setAnalyzing(false);
    }
  };

  const health =
    healthStyles[analysis?.health] || healthStyles.perlu_diperhatikan;
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Sparkles size={16} /> Business assistant
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Analisis keuangan
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Tinjau performa bulanan, pahami perubahan, dan tentukan langkah
            berikutnya.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-sm font-medium text-slate-700">
            Periode laporan
            <select
              value={selectedPeriod}
              onChange={(event) => {
                setSelectedPeriod(event.target.value);
                setAnalysis(null);
                setAnalysisError("");
              }}
              disabled={reportsLoading || !reports.length}
              className="mt-1 block h-11 min-w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              {reports.map((report) => (
                <option key={report.period} value={report.period}>
                  {formatPeriod(report.period)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={!selectedReport || analyzing || reportsLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : analysis ? (
              <RefreshCw size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {analyzing
              ? "Menganalisis..."
              : analysis
                ? "Analisis ulang"
                : "Mulai analisis"}
          </button>
        </div>
      </header>

      {reportsLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-blue-700" size={28} />
        </div>
      ) : reportsError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {reportsError}
        </div>
      ) : !reports.length ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center">
          <BarChart3 className="mx-auto text-slate-400" size={30} />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Belum ada laporan bulanan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Analisis akan tersedia setelah laporan bulanan tercatat di sistem.
          </p>
        </div>
      ) : selectedReport ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium text-slate-700">
              Ringkasan {formatPeriod(selectedPeriod)}
            </p>
            <p className="text-slate-500">
              {Number(selectedReport.transactionCount || 0).toLocaleString(
                "id-ID",
              )}{" "}
              transaksi tercatat
            </p>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinancialMetric
              title="Pemasukan"
              value={formatCurrency(income)}
              detail={compareWithPrevious("income")}
              icon={ArrowUpRight}
              color="bg-emerald-50 text-emerald-700"
            />
            <FinancialMetric
              title="Pengeluaran"
              value={formatCurrency(expense)}
              detail={compareWithPrevious("expense", true)}
              icon={ArrowDownRight}
              color="bg-rose-50 text-rose-700"
            />
            <FinancialMetric
              title="Saldo bersih"
              value={formatCurrency(balance)}
              detail={compareWithPrevious("balance")}
              icon={Wallet}
              color="bg-blue-50 text-blue-700"
            />
            <FinancialMetric
              title="Margin bersih"
              value={margin}
              detail="Saldo bersih dibanding pemasukan"
              icon={Activity}
              color="bg-amber-50 text-amber-700"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Tren pemasukan dan pengeluaran
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Hingga enam laporan terakhir sampai periode terpilih
                </p>
              </div>
              <p className="text-xs text-slate-500">Nilai dalam rupiah</p>
            </div>
            {chartData.length ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={76}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("id-ID", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.period
                          ? formatPeriod(payload[0].payload.period)
                          : ""
                      }
                      contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Pemasukan"
                      fill="#138a72"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Pengeluaran"
                      fill="#e56a54"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-slate-500">
                Belum ada data untuk ditampilkan.
              </p>
            )}
          </section>

          <section aria-live="polite">
            {analysisError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                {analysisError}
              </div>
            )}

            {analyzing ? (
              <div className="flex min-h-40 items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-800">
                <LoaderCircle className="animate-spin" size={20} />
                Membaca laporan dan membandingkan tren bulanan...
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <article className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      <Sparkles size={17} /> Analisis AI
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${health.className}`}
                    >
                      <HealthIcon size={14} /> {health.label}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                    {analysis.headline}
                  </h2>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                    {analysis.summary}
                  </p>
                </article>

                <div className="grid gap-4 xl:grid-cols-2">
                  <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Activity className="text-blue-700" size={18} />
                      <h2 className="font-semibold text-slate-900">
                        Temuan utama
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {analysis.insights.map((insight, index) => (
                        <article
                          key={`${insight.title}-${index}`}
                          className={`border-l-2 pl-4 ${toneStyles[insight.tone] || "border-slate-300"}`}
                        >
                          <h3 className="text-sm font-semibold text-slate-900">
                            {insight.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {insight.evidence}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-600">
                            {insight.meaning}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Lightbulb className="text-amber-600" size={18} />
                      <h2 className="font-semibold text-slate-900">
                        Langkah yang disarankan
                      </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {analysis.recommendations.map((recommendation, index) => (
                        <article
                          key={`${recommendation.title}-${index}`}
                          className="flex gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {recommendation.title}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityStyles[recommendation.priority] || priorityStyles.menengah}`}
                              >
                                Prioritas{" "}
                                {recommendation.priority || "menengah"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-5 text-slate-600">
                              {recommendation.action}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {analysis.outlook && (
                    <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Prospek dan perhatian
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {analysis.outlook}
                      </p>
                    </section>
                  )}
                  {analysis.limitations?.length > 0 && (
                    <section className="rounded-lg border border-slate-200 bg-white p-5">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Catatan data
                      </h2>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {analysis.limitations.map((limitation, index) => (
                          <li key={`${limitation}-${index}`}>{limitation}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Sparkles size={20} />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-slate-900">
                  Siap menganalisis {formatPeriod(selectedPeriod)}
                </h2>
                <p className="mt-1 max-w-lg text-sm text-slate-500">
                  AI akan merangkum perubahan, menunjukkan hal yang perlu
                  diperhatikan, dan menyarankan langkah berdasarkan laporan
                  bulanan.
                </p>
              </div>
            )}
          </section>

          <p className="text-xs leading-5 text-slate-500">
            Analisis dibuat dari angka laporan bulanan yang tersimpan. Gunakan
            sebagai bahan pertimbangan, bukan pengganti keputusan bisnis admin.
          </p>
        </>
      ) : null}
    </div>
  );
};

export default AIAnalysis;
