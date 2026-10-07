import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const FinancialChart = ({ data, description }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h2 className="font-semibold text-slate-900">Financial Overview</h2>

        <p className="mt-1 text-sm text-slate-500">
          {description || "Income and expenses over recent periods"}
        </p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis dataKey="name" axisLine={false} tickLine={false} />

            <YAxis axisLine={false} tickLine={false} />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="income"
              strokeWidth={2}
              fillOpacity={0.08}
            />

            <Area
              type="monotone"
              dataKey="expense"
              strokeWidth={2}
              fillOpacity={0.08}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialChart;
