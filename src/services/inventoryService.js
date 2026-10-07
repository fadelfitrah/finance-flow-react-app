import { request } from "./api";

export const getInventoryItems = async () => {
  const result = await request("/inventory");
  return result.items;
};

export const createInventoryItem = async (item) => {
  const result = await request("/inventory", {
    method: "POST",
    body: JSON.stringify(item),
  });

  return result.id;
};

export const updateInventoryItem = async (inventoryId, item) => {
  await request(`/inventory/${inventoryId}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
};
