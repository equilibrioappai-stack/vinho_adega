import { useState, useMemo } from "react";
import { useWines } from "../components/WineContext";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };

export default function Catalog() {
  const { wines } = useWines();
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
    <div style={{ background: "#15110a", minHeight: "100vh", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <div style={{ padding: "2rem 1.5rem 1.5rem", borderBottom: "0.5px solid #3a2e1e", background: "#1a1208" }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#a06420", marginBottom: 6 }}>
          Catálogo exclusivo
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 400, color: "#f0e8d8", lineHeight: 1.1, marginBottom: 4 }}>
          Adega<br />Selecionada
        </h1>
        <p style={{ fontSize: 12, color: "#7a6848", marginBottom: "1.5rem" }}>
          Argentina · Chile · Portugal · Espumantes
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rótulo..."
            style={{
              flex: 1, minWidth: 140,
              background: "#1e1810", border: "0.5px solid #3a2e1e", color: "#e8e0d0",
              borderRadius: 6, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", outline: "none"
            }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ background: "#1e1810", border: "0.5px solid #3a2e1e", color: "#e8e0d0", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontFamily: "inherit" }}
          >
            <option value="name">Nome A–Z</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="promo">Promoções primeiro</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "0.75rem 1.5rem", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "0.5px solid #1e1810" }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            style={{
              background: typeFilter === f.value ? "#a06420" : "transparent",
              border: "0.5px solid " + (typeFilter === f.value ? "#a06420" : "#3a2e1e"),
              color: typeFilter === f.value ? "#0f0c08" : "#7a6848",
              borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "inherit",
              cursor: "pointer", fontWeight: typeFilter === f.value ? 500 : 400
            }}
          >{f.label}</button>
        ))}
        {ORIGINS.map(o => (
          <button
            key={o.value}
            onClick={() => setOriginFilter(originFilter === o.value ? "all" : o.value)}
            style={{
              background: originFilter === o.value ? "#6a4020" : "transparent",
              border: "0.5px solid " + (originFilter === o.value ? "#6a4020" : "#3a2e1e"),
              color: originFilter === o.value ? "#f0d8b0" : "#5a4e38",
              borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "inherit",
              cursor: "pointer"
            }}
          >{o.label}</button>
        ))}
      </div>

      <p style={{ padding: "0.6rem 1.5rem", fontSize: 11, color: "#5a4e38" }}>
        {filtered.length} rótulos encontrados
      </p>

      {/* Grid: 3 colunas fixas em telas largas, com mais respiro entre cards */}
      <div
        style={{
          padding: "0.5rem 1.5rem 3rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {filtered.length === 0 && (
          <p style={{ color: "#5a4e38", padding: "2rem 0", gridColumn: "1/-1", textAlign: "center" }}>
            Nenhum rótulo encontrado.
          </p>
        )}
        {filtered.map(w => {
          const isPromo = !!w.promo;
          const isNew = w.tags?.includes("new");
          return (
            <div
              key={w.id}
              style={{
                background: "#231c12",
                border: "0.5px solid #3a2e1e",
                borderRadius: 12,
                padding: "1.1rem",
                display: "flex",
                gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 8, background: "#2e2418", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {TYPE_ICON[w.type] || "🍾"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: "#e8e0d0", lineHeight: 1.3, marginBottom: 3 }}>{w.name}</p>
                <p style={{ fontSize: 10.5, color: "#6a5c44", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  {w.type} · {w.origin.charAt(0) + w.origin.slice(1).toLowerCase()}
                </p>

                {(isPromo || isNew) && (
                  <div style={{ marginBottom: 8 }}>
                    {isPromo && (
                      <span style={{ fontSize: 9, letterSpacing: 1, padding: "2px 8px", borderRadius: 3, background: "#3a2808", color: "#d8a838", textTransform: "uppercase", fontWeight: 600 }}>
                        Promoção
                      </span>
                    )}
                    {isNew && !isPromo && (
                      <span style={{ fontSize: 9, letterSpacing: 1, padding: "2px 8px", borderRadius: 3, background: "#182030", color: "#7898d8", textTransform: "uppercase", fontWeight: 600 }}>
                        Novidade
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  {isPromo ? (
                    <>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 600, color: "#d8a838" }}>
                        R$ {w.promo.toLocaleString("pt-BR")}
                      </span>
                      <span style={{ fontSize: 11, color: "#5a4e38", textDecoration: "line-through" }}>
                        R$ {w.price.toLocaleString("pt-BR")}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 400, color: "#e8d8b8" }}>
                      R$ {w.price.toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "0.5px solid #1e1810", padding: "1rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#5a4e38" }}>Envio para todo o Brasil via transportadora · Pagamento antecipado via PIX</p>
        <p style={{ fontSize: 13, color: "#a06420", marginTop: 4, fontWeight: 500 }}>41 99648-3811 (Matheus Lucio)</p>
      </div>
    </div>
  );
}
