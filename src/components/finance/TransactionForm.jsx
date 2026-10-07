import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInventory } from "../../hooks/useInventory";
import { getTransactionHandlers } from "../../services/financeService";

const transactionSchema = z
  .object({
    date: z.string().min(1, "Date is required"),

    description: z
      .string()
      .min(2, "Pilih nama petugas yang menangani transaksi")
      .max(100, "Nama petugas terlalu panjang"),

    category: z.string().min(1, "Category is required"),

    categoryDetail: z.string().max(100, "Detail is too long"),

    inventoryItemId: z.string(),

    quantity: z.coerce
      .number()
      .int("Jumlah barang harus berupa bilangan bulat"),

    type: z.enum(["income", "expense"]),

    paymentMethod: z.enum(["cash", "qris"]),

    amount: z.coerce.number(),
  })
  .superRefine((values, context) => {
    if (
      ["Operasional", "Lain-lain"].includes(values.category) &&
      !values.categoryDetail.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryDetail"],
        message: "Detail kategori wajib diisi",
      });
    }

    if (values.category === "Jasa" && !values.inventoryItemId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inventoryItemId"],
        message: "Jasa wajib dipilih",
      });
    }

    if (values.category === "Barang" && !values.inventoryItemId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inventoryItemId"],
        message: "Barang wajib dipilih",
      });
    }

    if (values.category === "Barang" && values.quantity < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Jumlah barang minimal 1",
      });
    }

    if (values.category === "Restock" && !values.inventoryItemId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inventoryItemId"],
        message: "Barang yang akan di-restock wajib dipilih",
      });
    }

    if (values.category === "Restock" && values.quantity < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Jumlah restock minimal 1",
      });
    }

    if (values.category === "Restock" && values.type !== "expense") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["type"],
        message: "Restock harus dicatat sebagai pengeluaran",
      });
    }

    if (values.category !== "Barang" && values.amount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount must be greater than 0",
      });
    }
  });

const categories = ["Jasa", "Print", "Barang", "Restock", "Operasional"];

const TransactionForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [transactionHandlers, setTransactionHandlers] = useState([]);
  const [handlersLoading, setHandlersLoading] = useState(true);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: "",
      description: "",
      category: "",
      categoryDetail: "",
      inventoryItemId: "",
      quantity: 1,
      type: "income",
      paymentMethod: "cash",
      amount: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    getTransactionHandlers()
      .then((users) => !cancelled && setTransactionHandlers(users))
      .catch(() => !cancelled && setTransactionHandlers([]))
      .finally(() => !cancelled && setHandlersLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      const transactionDate = initialData.date?.toDate
        ? initialData.date.toDate()
        : new Date(initialData.date);

      const formattedDate = transactionDate.toISOString().split("T")[0];

      reset({
        date: formattedDate,
        description: initialData.description || "",
        category: initialData.category || "",
        categoryDetail: initialData.categoryDetail || "",
        inventoryItemId: initialData.inventoryItemId
          ? String(initialData.inventoryItemId)
          : "",
        quantity: initialData.quantity || 1,
        type: initialData.type || "income",
        paymentMethod: initialData.paymentMethod || "cash",
        amount: initialData.amount || "",
      });
    } else {
      reset({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        categoryDetail: "",
        inventoryItemId: "",
        quantity: 1,
        type: "income",
        paymentMethod: "cash",
        amount: "",
      });
    }
  }, [initialData, reset]);

  const selectedCategory = useWatch({ control, name: "category" });
  const selectedInventoryItemId = useWatch({
    control,
    name: "inventoryItemId",
  });
  const selectedQuantity = useWatch({ control, name: "quantity" });
  const { inventory, loading: inventoryLoading } = useInventory();
  const selectedInventoryItem = inventory.find(
    (item) =>
      String(item.id) === selectedInventoryItemId && item.category !== "Jasa",
  );
  const selectedService = inventory.find(
    (item) =>
      String(item.id) === selectedInventoryItemId && item.category === "Jasa",
  );
  const amount =
    Number(selectedInventoryItem?.price || 0) * Number(selectedQuantity || 0);
  const submitTransaction = (values) =>
    onSubmit({
      ...values,
      categoryDetail:
        values.category === "Barang" || values.category === "Restock"
          ? selectedInventoryItem?.item_name || ""
          : values.category === "Jasa"
            ? selectedService?.item_name || ""
            : values.categoryDetail,
      amount: values.category === "Barang" ? amount : values.amount,
    });

  return (
    <form onSubmit={handleSubmit(submitTransaction)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Date
        </label>

        <input
          type="date"
          {...register("date")}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        {errors.date && (
          <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Petugas yang menangani transaksi
        </label>

        <select
          {...register("description")}
          disabled={handlersLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
        >
          <option value="">
            {handlersLoading ? "Memuat daftar pengguna..." : "Pilih petugas"}
          </option>
          {initialData?.description &&
            !transactionHandlers.some(
              (user) => user.fullName === initialData.description,
            ) && (
              <option value={initialData.description}>
                {initialData.description} (data transaksi lama)
              </option>
            )}
          {transactionHandlers.map((user) => (
            <option key={user.uid} value={user.fullName}>
              {user.fullName} — {user.email}
            </option>
          ))}
        </select>

        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Category
          </label>

          <select
            {...register("category")}
            onChange={(event) => {
              const nextCategory = event.target.value;
              setValue("category", nextCategory);
              setValue("inventoryItemId", "");
              if (nextCategory === "Restock") {
                setValue("type", "expense");
              } else if (selectedCategory === "Restock") {
                setValue("type", "income");
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            {initialData?.category === "Lain-lain" && (
              <option value="Lain-lain">Lain-lain (transaksi lama)</option>
            )}
          </select>

          {errors.category && (
            <p className="mt-1 text-sm text-red-500">
              {errors.category.message}
            </p>
          )}
        </div>

        {["Operasional", "Lain-lain"].includes(selectedCategory) && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Detail operasional
            </label>

            <input
              type="text"
              placeholder="Contoh: Biaya listrik"
              {...register("categoryDetail")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {errors.categoryDetail && (
              <p className="mt-1 text-sm text-red-500">
                {errors.categoryDetail.message}
              </p>
            )}
          </div>
        )}

        {selectedCategory === "Jasa" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Pilih jasa
            </label>

            <select
              {...register("inventoryItemId")}
              disabled={inventoryLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
            >
              <option value="">
                {inventoryLoading ? "Memuat jasa..." : "Pilih jasa"}
              </option>
              {inventory
                .filter((item) => item.category === "Jasa")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name}
                  </option>
                ))}
            </select>

            {errors.inventoryItemId && (
              <p className="mt-1 text-sm text-red-500">
                {errors.inventoryItemId.message}
              </p>
            )}
          </div>
        )}

        {(selectedCategory === "Barang" || selectedCategory === "Restock") && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {selectedCategory === "Restock"
                ? "Pilih barang untuk restock"
                : "Pilih barang inventory"}
            </label>

            <select
              {...register("inventoryItemId")}
              disabled={inventoryLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
            >
              <option value="">
                {inventoryLoading
                  ? "Memuat barang..."
                  : selectedCategory === "Restock"
                    ? "Pilih barang untuk restock"
                    : "Pilih barang"}
              </option>
              {inventory
                .filter((item) => item.category !== "Jasa")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} ({item.stock} tersedia, Rp
                    {Number(item.price).toLocaleString("id-ID")}/unit)
                  </option>
                ))}
            </select>

            {errors.inventoryItemId && (
              <p className="mt-1 text-sm text-red-500">
                {errors.inventoryItemId.message}
              </p>
            )}
          </div>
        )}

        {(selectedCategory === "Barang" || selectedCategory === "Restock") && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {selectedCategory === "Restock"
                ? "Jumlah restock"
                : "Jumlah barang"}
            </label>

            <input
              type="number"
              min="1"
              step="1"
              {...register("quantity")}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {errors.quantity && (
              <p className="mt-1 text-sm text-red-500">
                {errors.quantity.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Type
          </label>

          <select
            {...register("type")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {selectedCategory === "Restock" ? (
              <option value="expense">Expense</option>
            ) : (
              <>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Metode Pembayaran
          </label>

          <select
            {...register("paymentMethod")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {selectedCategory === "Restock" ? "Total biaya restock" : "Amount"}
        </label>

        {selectedCategory === "Barang" ? (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Rp{amount.toLocaleString("id-ID")}
            {selectedInventoryItem && (
              <span className="ml-2 text-slate-500">
                ({Number(selectedInventoryItem.price).toLocaleString("id-ID")} ×{" "}
                {Number(selectedQuantity || 0).toLocaleString("id-ID")})
              </span>
            )}
          </div>
        ) : (
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={
              selectedCategory === "Restock" ? "Biaya pembelian" : "0"
            }
            {...register("amount")}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        )}

        {errors.amount && (
          <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Transaction"
              : "Add Transaction"}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
