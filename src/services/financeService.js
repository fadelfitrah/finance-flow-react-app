import { request } from "./api";

export const getUserTransactions = async (userId, limit) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const query = Number.isInteger(limit) ? `?limit=${limit}` : "";
  const result = await request(`/transactions${query}`);
  return result.transactions;
};

export const getMonthlyFinancialReports = async () => {
  const result = await request("/monthly-reports");
  return result.reports;
};

export const getInventoryFinancialTransactions = async () => {
  const result = await request("/inventory-financial-transactions");
  return result.transactions;
};

export const getDailyHandlerIncome = async (date) => {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const result = await request(`/transactions/daily-handler-income${query}`);
  return result;
};

export const getTransactionHandlers = async () => {
  const result = await request("/users");
  return result.users;
};

export const saveMonthlyReport = async ({ income, expense }) => {
  const result = await request("/monthly-reports", {
    method: "POST",
    body: JSON.stringify({
      income: Number(income),
      expense: Number(expense),
    }),
  });

  return result.period;
};

export const createTransaction = async ({
  userId,
  date,
  description,
  category,
  categoryDetail,
  inventoryItemId,
  quantity,
  type,
  paymentMethod,
  amount,
}) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const result = await request("/transactions", {
    method: "POST",
    body: JSON.stringify({
      date,
      description: description.trim(),
      category,
      categoryDetail: categoryDetail?.trim() || null,
      inventoryItemId: inventoryItemId || null,
      quantity: ["Barang", "Restock"].includes(category)
        ? Number(quantity)
        : 1,
      type,
      paymentMethod,
      amount: Number(amount),
    }),
  });

  return result.id;
};

export const updateTransaction = async (transactionId, data) => {
  if (!transactionId) {
    throw new Error("Transaction ID is required.");
  }

  await request(`/transactions/${transactionId}`, {
    method: "PUT",
    body: JSON.stringify({
      date: data.date,
      description: data.description.trim(),
      category: data.category,
      categoryDetail: data.categoryDetail?.trim() || null,
      inventoryItemId: data.inventoryItemId || null,
      quantity: ["Barang", "Restock"].includes(data.category)
        ? Number(data.quantity)
        : 1,
      type: data.type,
      paymentMethod: data.paymentMethod,
      amount: Number(data.amount),
    }),
  });
};

export const deleteTransaction = async (transactionId) => {
  if (!transactionId) {
    throw new Error("Transaction ID is required.");
  }

  await request(`/transactions/${transactionId}`, {
    method: "DELETE",
  });
};
