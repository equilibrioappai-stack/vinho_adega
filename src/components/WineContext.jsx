import { createContext, useContext, useState, useMemo } from "react";
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

  // Carrinho: mapa { [wineId]: quantidade }
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("adega_cart");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const save = (updated) => {
    setWines(updated);
    try { localStorage.setItem("adega_wines", JSON.stringify(updated)); } catch {}
  };

  const saveCart = (updated) => {
    setCart(updated);
    try { localStorage.setItem("adega_cart", JSON.stringify(updated)); } catch {}
  };

  const addWine = (wine) => {
    const newId = Math.max(0, ...wines.map(w => w.id)) + 1;
    save([...wines, { ...wine, id: newId }]);
  };
  const updateWine = (id, wine) => save(wines.map(w => w.id === id ? { ...wine, id } : w));
  const deleteWine = (id) => save(wines.filter(w => w.id !== id));

  const addToCart = (id) => {
    saveCart({ ...cart, [id]: (cart[id] || 0) + 1 });
  };
  const decreaseFromCart = (id) => {
    const current = cart[id] || 0;
    if (current <= 1) {
      const next = { ...cart };
      delete next[id];
      saveCart(next);
    } else {
      saveCart({ ...cart, [id]: current - 1 });
    }
  };
  const removeFromCart = (id) => {
    const next = { ...cart };
    delete next[id];
    saveCart(next);
  };
  const clearCart = () => saveCart({});

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const wine = wines.find(w => w.id === Number(id));
        if (!wine) return null;
        const unitPrice = wine.promo || wine.price;
        return { wine, qty, unitPrice, lineTotal: unitPrice * qty };
      })
      .filter(Boolean);
  }, [cart, wines]);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((a, item) => a + item.lineTotal, 0), [cartItems]);

  return (
    <WineContext.Provider value={{
      wines, addWine, updateWine, deleteWine,
      cart, cartItems, cartCount, cartTotal,
      addToCart, decreaseFromCart, removeFromCart, clearCart,
    }}>
      {children}
    </WineContext.Provider>
  );
}

export const useWines = () => useContext(WineContext);
