const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType = "neutral",
}) => {
  const trendStyles = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-red-600 bg-red-50",
    neutral: "text-slate-600 bg-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {trend && (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${trendStyles[trendType]}`}
          >
            {trend}
          </span>
        )}

        {description && (
          <span className="text-xs text-slate-500">{description}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
