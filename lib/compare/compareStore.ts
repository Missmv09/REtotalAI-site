import { useEffect, useState } from "react";

const KEY = "compare:set:v1";

export function useCompareSet() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [ids]);

  const add = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const remove = (id: string) =>
    setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);

  return { ids, add, remove, clear };
}
