import { request } from "./api";

export const getMonthlyInventoryAnalysis = async (period) => {
  const result = await request(
    `/ai/monthly-inventory-analysis?period=${encodeURIComponent(period)}`,
  );

  return result.analysis;
};

export const getMonthlyInventoryRecommendations = async (period) => {
  const result = await request("/ai/monthly-inventory-recommendations", {
    method: "POST",
    body: JSON.stringify({ period }),
  });

  return result.analysis;
};

export const analyzeMonthlyFinancialReport = async (period) => {
  const result = await request("/ai/monthly-analysis", {
    method: "POST",
    body: JSON.stringify({ period }),
  });

  return result.analysis;
};