import { useState, useMemo } from "react";
import { useWines } from "../components/WineContext";
import { C, FONT } from "../theme";
import Cart from "./Cart";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };

export default function Catalog() {
  const { wines, cart, addToCart, decreaseFromCart } = useWines();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [sort, setSort] = useState("name");

  const filtered = useMemo(() => {
    let list = wines.filter(w => {
      const q = search.toLowerCase();
      const matchS = !q || w.name.toLowerCase().includes(q) || w.origin.toLowerCase().includes(q);
      const matchT = typeFilter === "all" || w.type === typeFilter;
      const matchO = originFilter === "all" || w.origin === originFilter;
      return matchS && matchT && matchO;
    });
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "price-asc") list.sort((a, b) => (a.promo || a.price) - (b.promo || b.price));
    else if (sort === "price-desc") list.sort((a, b) => (b.promo || b.price) - (a.promo || a.price));
    else if (sort === "promo") list.sort((a, b) => (b.promo ? 1 : 0) - (a.promo ? 1 : 0));
    return list;
  }, [wines, search, typeFilter, originFilter, sort]);

  const FILTERS = [
    { label: "Todos", value: "all" },
    { label: "Tintos", value: "Tinto" },
    { label: "Brancos", value: "Branco" },
    { label: "Rosés", value: "Rosé" },
    { label: "Espumantes", value: "Espumante" },
  ];

  const ORIGINS = [
    { label: "Argentina", value: "ARGENTINA" },
    { label: "Chile", value: "CHILE" },
    { label: "Portugal", value: "PORTUGAL" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      {/* Hero */}
      <div style={{ padding: "1.75rem 1.25rem 1.25rem", borderBottom: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.gold, marginBottom: 6, fontWeight: 600 }}>
          Catálogo exclusivo
        </p>
        <h1 style={{ fontFamily: FONT, fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.15, marginBottom: 4, letterSpacing: -0.5 }}>
          Adega Selecionada
        </h1>
        <p style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: "1.25rem" }}>
          Argentina · Chile · Portugal · Espumantes
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rótulo..."
            style={{
              flex: 1, minWidth: 140,
              background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
              borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none"
            }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 8, padding: "10px 10px", fontSize: 13, fontFamily: "inherit" }}
          >
            <option value="name">Nome A–Z</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="promo">Promoções primeiro</option>
          </select>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: "0.85rem 1.25rem", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${C.line}` }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            style={{
              background: typeFilter === f.value ? C.ink : "transparent",
              border: `1px solid ${typeFilter === f.value ? C.ink : C.line}`,
              color: typeFilter === f.value ? C.surface : C.inkSoft,
              borderRadius: 20, padding: "5px 13px", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", fontWeight: typeFilter === f.value ? 600 : 400
            }}
          >{f.label}</button>
        ))}
        {ORIGINS.map(o => (
          <button
            key={o.value}
            onClick={() => setOriginFilter(originFilter === o.value ? "all" : o.value)}
            style={{
              background: originFilter === o.value ? C.accentSoft : "transparent",
              border: `1px solid ${originFilter === o.value ? C.accent : C.line}`,
              color: originFilter === o.value ? C.accent : C.muted,
              borderRadius: 20, padding: "5px 13px", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer"
            }}
          >{o.label}</button>
        ))}
      </div>

      <p style={{ padding: "0.7rem 1.25rem 0.2rem", fontSize: 11.5, color: C.muted }}>
        {filtered.length} rótulos encontrados
      </p>

      {/* Lista, uma coluna, divisórias finas em vez de cards */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0.25rem 1.25rem 4rem" }}>
        {filtered.length === 0 && (
          <p style={{ color: C.muted, padding: "2.5rem 0", textAlign: "center", fontSize: 13.5 }}>
            Nenhum rótulo encontrado.
          </p>
        )}
        {filtered.map(w => {
          const isPromo = !!w.promo;
          const isNew = w.tags?.includes("new");
          const qtyInCart = cart[w.id] || 0;
          return (
            <div
              key={w.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "1rem 0",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <div style={{ fontSize: 20, lineHeight: 1, marginTop: 2, flexShrink: 0, width: 24, textAlign: "center" }}>
                {TYPE_ICON[w.type] || "🍾"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{w.name}</p>
                  {isPromo && (
                    <span style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>
                      · promoção
                    </span>
                  )}
                  {isNew && !isPromo && (
                    <span style={{ fontSize: 9.5, letterSpacing: 0.5, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>
                      · novidade
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2, marginBottom: 10 }}>
                  {w.type} · {w.origin.charAt(0) + w.origin.slice(1).toLowerCase()}
                </p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    {isPromo ? (
                      <>
                        <span style={{ fontFamily: FONT, fontSize: 16.5, fontWeight: 700, color: C.accent }}>
                          R$ {w.promo.toLocaleString("pt-BR")}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.muted, textDecoration: "line-through" }}>
                          R$ {w.price.toLocaleString("pt-BR")}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontFamily: FONT, fontSize: 16.5, fontWeight: 700, color: C.ink }}>
                        R$ {w.price.toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>

                  {qtyInCart === 0 ? (
                    <button
                      onClick={() => addToCart(w.id)}
                      style={{
                        background: C.ink, color: C.surface, border: "none",
                        borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Adicionar
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => decreaseFromCart(w.id)} style={qtyBtn}>–</button>
                      <span style={{ fontSize: 13, minWidth: 14, textAlign: "center", fontWeight: 600 }}>{qtyInCart}</span>
                      <button onClick={() => addToCart(w.id)} style={qtyBtn}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "1.25rem", textAlign: "center" }}>
        <p style={{ fontSize: 11.5, color: C.muted }}>Envio para todo o Brasil via transportadora · Pagamento antecipado via PIX</p>
        <p style={{ fontSize: 13, color: C.accent, marginTop: 4, fontWeight: 600 }}>41 99648-3811 (Matheus Lucio)</p>
      </div>

      <Cart />
    </div>
  );
}

const qtyBtn = {
  background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
  borderRadius: 6, width: 24, height: 24, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
