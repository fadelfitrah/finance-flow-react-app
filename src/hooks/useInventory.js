import { useCallback, useEffect, useState } from "react";

import { getInventoryItems } from "../services/inventoryService";

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setInventory(await getInventoryItems());
    } catch (requestError) {
      console.error("Fetch inventory error:", requestError);
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchInventory, 0);

    return () => window.clearTimeout(timer);
  }, [fetchInventory]);

  return { inventory, loading, error, refetch: fetchInventory };
};
