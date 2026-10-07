import { useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500";

const InventoryForm = ({
  initialData,
  categories = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form, setForm] = useState({
    itemCode: initialData?.item_id || "",
    itemName: initialData?.item_name || "",
    category: initialData?.category || "",
    stock: String(initialData?.stock ?? 0),
    price: String(initialData?.price ?? ""),
  });
  const isService = form.category === "Jasa";

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      itemCode: form.itemCode.trim(),
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      stock: isService ? 0 : Number(form.stock),
      price: isService ? 0 : Number(form.price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="inventory-item-code"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Kode barang
        </label>
        <input
          id="inventory-item-code"
          name="itemCode"
          value={form.itemCode}
          onChange={updateField}
          required
          maxLength={50}
          placeholder="Contoh: BRG-001"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="inventory-item-name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nama barang
        </label>
        <input
          id="inventory-item-name"
          name="itemName"
          value={form.itemName}
          onChange={updateField}
          required
          maxLength={100}
          placeholder="Contoh: Kertas A4"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="inventory-category"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Kategori
        </label>
        <select
          id="inventory-category"
          name="category"
          value={form.category}
          onChange={updateField}
          required
          className={inputClassName}
        >
          <option value="">Pilih kategori</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption}
            </option>
          ))}
        </select>
      </div>

      {!isService && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inventory-stock"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Stok awal
            </label>
            <input
              id="inventory-stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={updateField}
              required
              min="0"
              step="1"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="inventory-price"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Harga satuan (Rp)
            </label>
            <input
              id="inventory-price"
              name="price"
              type="number"
              value={form.price}
              onChange={updateField}
              required
              min="0.01"
              step="0.01"
              placeholder="0"
              className={inputClassName}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Menyimpan..."
            : initialData
              ? "Simpan perubahan"
              : "Tambah barang"}
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;
