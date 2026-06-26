import { createContext, useContext, useState } from "react";
import { initialWines } from "../data/wines";

const WineContext = createContext(null);

export function WineProvider({ children }) {
  const [wines, setWines] = useState(() => {
    try {
      const stored = localStorage.getItem("adega_wines");
      return stored ? JSON.parse(stored) : initialWines;
    } catch {
      return initialWines;
    }
  });

  const save = (updated) => {
    setWines(updated);
    try { localStorage.setItem("adega_wines", JSON.stringify(updated)); } catch {}
  };

  const addWine = (wine) => {
    const newId = Math.max(0, ...wines.map(w => w.id)) + 1;
    save([...wines, { ...wine, id: newId }]);
  };

  const updateWine = (id, wine) => save(wines.map(w => w.id === id ? { ...wine, id } : w));
  const deleteWine = (id) => save(wines.filter(w => w.id !== id));

  return (
    <WineContext.Provider value={{ wines, addWine, updateWine, deleteWine }}>
      {children}
    </WineContext.Provider>
  );
}

export const useWines = () => useContext(WineContext);
