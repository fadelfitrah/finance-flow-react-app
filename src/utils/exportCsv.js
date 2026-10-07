export const exportTransactionsToCSV = (
  transactions,
  filename = "transactions.csv",
) => {
  if (!transactions.length) {
    return;
  }

  const headers = [
    "Date",
    "Description",
    "Category",
    "Jumlah Barang",
    "Type",
    "Amount",
  ];

  const rows = transactions.map((transaction) => {
    const date = transaction.date?.toDate
      ? transaction.date.toDate().toLocaleDateString("id-ID")
      : "";

    return [
      date,
      transaction.description,
      transaction.category,
      transaction.category === "Barang" ? transaction.quantity : "",
      transaction.type,
      transaction.amount,
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
