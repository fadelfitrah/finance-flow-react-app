import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import {
  getMonthlyInventoryAnalysis,
  getMonthlyInventoryRecommendations,
} from "../services/aiService";
import { getMonthlyFinancialReports } from "../services/financeService";
import { formatCurrency } from "../utils/formatCurrency";

const formatPeriod = (period) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${period}-01T00:00:00`));

const priorityStyles = {
  tinggi: "bg-rose-50 text-rose-700",
  menengah: "bg-amber-50 text-amber-700",
  rendah: "bg-slate-100 text-slate-600",
};

const Metric = ({ title, value, detail, icon: Icon, color }) => (
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

const InventoryAIAnalysis = () => {
  const [reports, setReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState("");
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recommendationsError, setRecommendationsError] = useState("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMonthlyFinancialReports()
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        setSelectedPeriod(data[0]?.period || "");
      })
      .catch(
        (error) =>
          !cancelled &&
          setReportsError(error.message || "Periode laporan gagal dimuat."),
      )
      .finally(() => !cancelled && setLoadingReports(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoadingMetrics(true);
      setMetrics(null);
      setMetricsError("");
      getMonthlyInventoryAnalysis(selectedPeriod)
        .then((data) => !cancelled && setMetrics(data))
        .catch(
          (error) =>
            !cancelled &&
            setMetricsError(
              error.message ||
                "Analisis pemasukan dan modal barang gagal dimuat.",
            ),
        )
        .finally(() => !cancelled && setLoadingMetrics(false));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPeriod]);

  const runRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendations(null);
    setRecommendationsError("");
    try {
      setRecommendations(
        await getMonthlyInventoryRecommendations(selectedPeriod),
      );
    } catch (error) {
      setRecommendationsError(error.message || "Rekomendasi AI gagal dibuat.");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const restockExpense = Number(metrics?.restockExpense || 0);
  const itemIncome = Number(metrics?.itemIncome || 0);
  const difference = itemIncome - restockExpense;
  const hasRestockExpense = restockExpense > 0;
  const covered = hasRestockExpense && difference >= 0;

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
            <Sparkles size={16} /> Business assistant
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Analisis modal dan pemasukan
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Bandingkan modal restok dengan pemasukan penjualan barang dan
            dapatkan rekomendasi AI yang lebih fokus.
          </p>
        </div>
        <label className="text-sm font-medium text-slate-700">
          Periode laporan
          <select
            value={selectedPeriod}
            onChange={(event) => {
              setSelectedPeriod(event.target.value);
              setRecommendations(null);
              setRecommendationsError("");
            }}
            disabled={loadingReports || !reports.length}
            className="mt-1 block h-11 min-w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
          >
            {reports.map((report) => (
              <option key={report.period} value={report.period}>
                {formatPeriod(report.period)}
              </option>
            ))}
          </select>
        </label>
      </header>

      {loadingReports ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-violet-700" size={28} />
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
            Analisis tersedia setelah laporan bulanan tercatat di sistem.
          </p>
        </div>
      ) : loadingMetrics ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-violet-700" size={28} />
        </div>
      ) : metricsError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {metricsError}
        </div>
      ) : (
        metrics && (
          <>
            <section className="grid gap-3 sm:grid-cols-2">
              <Metric
                title="Modal restok"
                value={formatCurrency(restockExpense)}
                detail={`${Number(metrics.restockQuantity || 0).toLocaleString("id-ID")} barang · ${Number(metrics.restockTransactionCount || 0).toLocaleString("id-ID")} transaksi`}
                icon={ArrowDownRight}
                color="bg-rose-50 text-rose-700"
              />
              <Metric
                title="Pemasukan penjualan barang"
                value={formatCurrency(itemIncome)}
                detail={`${Number(metrics.itemIncomeQuantity || 0).toLocaleString("id-ID")} barang · ${Number(metrics.itemIncomeTransactionCount || 0).toLocaleString("id-ID")} transaksi`}
                icon={ArrowUpRight}
                color="bg-emerald-50 text-emerald-700"
              />
            </section>

            <section
              className={`rounded-lg border p-5 ${!hasRestockExpense ? "border-slate-200 bg-slate-50 text-slate-700" : covered ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}
            >
              <div className="flex items-start gap-3">
                {covered ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                ) : (
                  <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                )}
                <div>
                  <h2 className="font-semibold">
                    {!hasRestockExpense
                      ? "Belum ada modal restok untuk dibandingkan"
                      : covered
                        ? "Pemasukan barang sudah menutupi modal restok"
                        : "Pemasukan barang belum menutupi modal restok"}
                  </h2>
                  {hasRestockExpense && (
                    <p className="mt-1 text-sm">
                      {difference >= 0
                        ? `Kelebihan ${formatCurrency(difference)}`
                        : `Kekurangan ${formatCurrency(Math.abs(difference))}`}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs leading-5">
                Perbandingan memakai belanja restok dan penjualan barang dalam
                bulan terpilih. Ini bukan HPP barang terjual ataupun keuntungan
                bersih.
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Rekomendasi tindakan
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Minta AI menyusun langkah dari transaksi bulan ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runRecommendations}
                  disabled={loadingRecommendations}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingRecommendations ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {loadingRecommendations
                    ? "Menganalisis..."
                    : recommendations
                      ? "Analisis ulang"
                      : "Minta rekomendasi AI"}
                </button>
              </div>
              {recommendationsError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {recommendationsError}
                </div>
              )}
              {recommendations && (
                <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/50 p-4 sm:p-5">
                  <h3 className="font-semibold text-slate-900">
                    {recommendations.headline}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {recommendations.summary}
                  </p>
                  <div className="mt-4 space-y-3">
                    {recommendations.recommendations.map(
                      (recommendation, index) => (
                        <article
                          key={`${recommendation.title}-${index}`}
                          className="flex gap-3 rounded-lg bg-white p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-800">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-slate-900">
                                {recommendation.title}
                              </h4>
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
                      ),
                    )}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    {recommendations.caveat}
                  </p>
                </div>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
};

export default InventoryAIAnalysis;
