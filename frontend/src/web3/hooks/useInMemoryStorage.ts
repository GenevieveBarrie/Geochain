import { useState } from "react";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";

export function useInMemoryStorage() {
  const [storage] = useState<GenericStringStorage>(() => {
    const store = new Map<string, string>();
    return {
      async getItem(key: string) {
        return store.get(key) || null;
      },
      async setItem(key: string, value: string) {
        store.set(key, value);
      },
      async removeItem(key: string) {
        store.delete(key);
      },
    };
  });

  return { storage };
}


