import { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { useInventory } from "../hooks/useInventory";
import {
  createInventoryItem,
  updateInventoryItem,
} from "../services/inventoryService";
import { getInventoryFinancialTransactions } from "../services/financeService";
import { formatCurrency } from "../utils/formatCurrency";
import InventoryForm from "../components/inventory/InventoryForm";
import InventoryTable from "../components/inventory/InventoryTable";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";

const Inventory = () => {
  const { inventory, loading, error, refetch } = useInventory();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [inventoryExpenses, setInventoryExpenses] = useState([]);
  const [expensePeriod, setExpensePeriod] = useState("monthly");
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getInventoryFinancialTransactions()
      .then((transactions) => {
        if (!cancelled) setInventoryExpenses(transactions);
      })
      .catch((error) => {
        console.error("Fetch inventory financial transactions error:", error);
        if (!cancelled) setExpensesError(true);
      })
      .finally(() => {
        if (!cancelled) setExpensesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveItem = async (item) => {
    try {
      setSavingItem(true);
      if (editingItem) {
        await updateInventoryItem(editingItem.id, item);
      } else {
        await createInventoryItem(item);
      }
      await refetch();
      setFormOpen(false);
      setEditingItem(null);
      toast.success(
        editingItem
          ? "Data barang berhasil diperbarui."
          : "Barang berhasil ditambahkan.",
      );
    } catch (saveError) {
      toast.error(saveError.message || "Gagal menyimpan barang.");
    } finally {
      setSavingItem(false);
    }
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const filteredInventory = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return inventory;
    }

    return inventory.filter((item) =>
      [item.item_id, item.item_name, item.category]
        .join(" ")
        .toLowerCase()
        .includes(searchValue),
    );
  }, [inventory, search]);

  const totalStock = inventory.reduce(
    (total, item) => total + Number(item.stock || 0),
    0,
  );
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMonthKey = todayKey.slice(0, 7);
  const todayInventoryExpenses = inventoryExpenses
    .filter((transaction) => String(transaction.date).slice(0, 10) === todayKey)
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const monthlyInventoryExpenses = inventoryExpenses
    .filter(
      (transaction) => String(transaction.date).slice(0, 7) === currentMonthKey,
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const filteredInventoryExpenses = inventoryExpenses.filter((transaction) =>
    expensePeriod === "today"
      ? String(transaction.date).slice(0, 10) === todayKey
      : String(transaction.date).slice(0, 7) === currentMonthKey,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Inventory</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Inventory Toko
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Lihat daftar barang dan jumlah stok yang tersimpan di database.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus size={17} />
          Tambah barang
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">Inventory gagal dimuat</p>
          <p className="mt-1 text-sm text-red-600">
            Pastikan API dan koneksi MySQL sedang berjalan.
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Boxes size={21} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Jenis barang
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {inventory.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total stok</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalStock.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pengeluaran restok
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Modal yang dikeluarkan untuk restok hari ini dan bulan ini.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Modal restok hari ini
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {expensesLoading
                    ? "Memuat..."
                    : expensesError
                      ? "Gagal dimuat"
                      : formatCurrency(todayInventoryExpenses)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Modal restok bulan ini
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {expensesLoading
                    ? "Memuat..."
                    : expensesError
                      ? "Gagal dimuat"
                      : formatCurrency(monthlyInventoryExpenses)}
                </p>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-2"
              aria-label="Filter periode transaksi restok"
            >
              {[
                { value: "today", label: "Hari ini" },
                { value: "monthly", label: "Bulan ini" },
              ].map((periodOption) => (
                <button
                  key={periodOption.value}
                  type="button"
                  onClick={() => setExpensePeriod(periodOption.value)}
                  aria-pressed={expensePeriod === periodOption.value}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    expensePeriod === periodOption.value
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {periodOption.label}
                </button>
              ))}
            </div>

            {expensesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Rekap pengeluaran inventory gagal dimuat.
              </div>
            ) : expensesLoading ? (
              <div className="flex min-h-24 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <LoadingSpinner />
              </div>
            ) : filteredInventoryExpenses.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                Tidak ada transaksi restok{" "}
                {expensePeriod === "today" ? "hari ini." : "bulan ini."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                          Tanggal
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                          Barang
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                          Jumlah
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                          Pengeluaran
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInventoryExpenses.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-5 py-3 text-sm text-slate-600">
                            {new Date(
                              `${transaction.date}T00:00:00`,
                            ).toLocaleDateString("id-ID")}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-800">
                            {transaction.itemName}
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-slate-600">
                            {Number(transaction.quantity).toLocaleString(
                              "id-ID",
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-medium text-slate-800">
                            {formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Search
              size={18}
              className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari ID, nama barang, atau kategori..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <InventoryTable
            inventory={filteredInventory}
            loading={loading}
            onEdit={openEditForm}
          />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          if (!savingItem) setFormOpen(false);
        }}
        title={
          editingItem
            ? `Edit barang (ID ${editingItem.id})`
            : "Tambah barang inventory"
        }
      >
        <InventoryForm
          key={editingItem?.id || "new-inventory-item"}
          initialData={editingItem}
          categories={[...new Set(inventory.map((item) => item.category))]}
          onSubmit={handleSaveItem}
          onCancel={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
          loading={savingItem}
        />
      </Modal>
    </div>
  );
};

export default Inventory;
