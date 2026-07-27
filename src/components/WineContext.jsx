import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";

const WineContext = createContext(null);

export function WineProvider({ children, supplierSlug }) {
  const [supplier, setSupplier] = useState(null);
  const [wines, setWines] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "not_found" | "error"

  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("adega_cart");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveCart = (updated) => {
    setCart(updated);
    try { localStorage.setItem("adega_cart", JSON.stringify(updated)); } catch {}
  };

  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem("adega_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [customerPhone, setCustomerPhoneState] = useState(() => {
    try { return localStorage.getItem("adega_customer_phone") || ""; } catch { return ""; }
  });

  const setCustomerPhone = async (phone) => {
    setCustomerPhoneState(phone);
    try { localStorage.setItem("adega_customer_phone", phone); } catch {}
    if (supplier && favorites.length > 0) {
      await supabase.from("customer_favorites")
        .upsert(favorites.map(wine_id => ({ supplier_id: supplier.id, phone, wine_id })), { onConflict: "supplier_id,phone,wine_id" });
    }
  };

  const toggleFavorite = (id) => {
    const isFav = favorites.includes(id);
    const updated = isFav ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(updated);
    try { localStorage.setItem("adega_favorites", JSON.stringify(updated)); } catch {}

    if (supplier && customerPhone) {
      if (isFav) {
        supabase.from("customer_favorites").delete().match({ supplier_id: supplier.id, phone: customerPhone, wine_id: id });
      } else {
        supabase.from("customer_favorites").upsert(
          { supplier_id: supplier.id, phone: customerPhone, wine_id: id },
          { onConflict: "supplier_id,phone,wine_id" }
        );
      }
    }
  };

  useEffect(() => {
    if (!supplierSlug) { setStatus("not_found"); return; }
    let cancelled = false;

    (async () => {
      setStatus("loading");
      const { data: supplierRow, error: supplierErr } = await supabase
        .from("suppliers_public")
        .select("*")
        .eq("slug", supplierSlug)
        .maybeSingle();

      if (cancelled) return;
      if (supplierErr || !supplierRow) { setStatus("not_found"); return; }
      setSupplier(supplierRow);

      const { data: wineRows, error: wineErr } = await supabase
        .from("wines")
        .select("*")
        .eq("supplier_id", supplierRow.id)
        .order("name");

      if (cancelled) return;
      if (wineErr) { setStatus("error"); return; }
      setWines(wineRows || []);
      setStatus("ready");
    })();

    return () => { cancelled = true; };
  }, [supplierSlug]);

  const addToCart = (id) => saveCart({ ...cart, [id]: (cart[id] || 0) + 1 });
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
        const wine = wines.find(w => String(w.id) === String(id));
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
      supplier, wines, status,
      cart, cartItems, cartCount, cartTotal,
      addToCart, decreaseFromCart, removeFromCart, clearCart,
      favorites, toggleFavorite, customerPhone, setCustomerPhone,
    }}>
      {children}
    </WineContext.Provider>
  );
}

export const useWines = () => useContext(WineContext);
