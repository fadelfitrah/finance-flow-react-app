import { useCallback, useEffect, useState } from "react";

import {
  getUserTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "../services/financeService";

export const useTransactions = (userId, limit) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUserTransactions(userId, limit);

      setTransactions(data);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {
    Promise.resolve().then(fetchTransactions);
  }, [fetchTransactions]);

  // ==========================================
  // CREATE TRANSACTION
  // ==========================================

  const addTransaction = async (data) => {
    try {
      setError(null);

      await createTransaction({
        userId,
        ...data,
      });

      await fetchTransactions();
    } catch (err) {
      console.error("Add transaction error:", err);
      setError(err);

      throw err;
    }
  };

  // ==========================================
  // UPDATE TRANSACTION
  // ==========================================

  const editTransaction = async (transactionId, data) => {
    try {
      setError(null);

      await updateTransaction(transactionId, data);

      await fetchTransactions();
    } catch (err) {
      console.error("Update transaction error:", err);
      setError(err);

      throw err;
    }
  };

  // ==========================================
  // DELETE TRANSACTION
  // ==========================================

  const removeTransaction = async (transactionId) => {
    try {
      setError(null);

      await deleteTransaction(transactionId);

      await fetchTransactions();
    } catch (err) {
      console.error("Delete transaction error:", err);
      setError(err);

      throw err;
    }
  };

  // ==========================================
  // RETURN
  // ==========================================

  return {
    transactions,
    loading,
    error,
    addTransaction,
    editTransaction,
    removeTransaction,
    refetch: fetchTransactions,
  };
};
