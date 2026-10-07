const TransactionFilters = ({
  search,
  setSearch,
  type,
  setType,
  category,
  setCategory,
}) => {
  const categories = [
    "Jasa",
    "Print",
    "Barang",
    "Restock",
    "Operasional",
    "Lain-lain",
  ];

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search transactions..."
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      />

      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="all">All Types</option>

        <option value="income">Income</option>

        <option value="expense">Expense</option>
      </select>

      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="all">All Categories</option>

        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TransactionFilters;
