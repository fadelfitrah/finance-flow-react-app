import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";
import { Pencil } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

const InventoryTable = ({ inventory, loading, onEdit }) => {
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!inventory.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white">
        <EmptyState
          title="No inventory items found"
          description="Try adding an item or changing your filters."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                ID
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Item ID
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Item Name
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Category
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase text-slate-500">
                Stock
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Harga Satuan
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {inventory.map((item) => {
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.id}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.item_id}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    <span className="font-medium text-slate-800">
                      {item.item_name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {item.category}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {Number(item.stock).toLocaleString("id-ID")}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                    {item.category === "Jasa" ? "-" : formatCurrency(item.price)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      title={`Edit ${item.item_name} (ID ${item.id})`}
                      aria-label={`Edit ${item.item_name}`}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
