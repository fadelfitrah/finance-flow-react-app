export const calculateTotalIncome = (transactions) => {
  return transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => {
      return total + Number(transaction.amount || 0);
    }, 0);
};

export const calculateTotalExpense = (transactions) => {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => {
      return total + Number(transaction.amount || 0);
    }, 0);
};

export const calculateBalance = (transactions) => {
  return (
    calculateTotalIncome(transactions) - calculateTotalExpense(transactions)
  );
};

export const filterTransactionsByType = (transactions, type) => {
  if (type === "all") {
    return transactions;
  }

  return transactions.filter((transaction) => transaction.type === type);
};
