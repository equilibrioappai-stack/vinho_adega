import { useState, useMemo } from "react";
import { useWines } from "../components/WineContext";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };

const BADGE_STYLE = {
  Tinto:     { bg: "#3a1520", color: "#c87890" },
  Branco:    { bg: "#1a2e18", color: "#78b870" },
  Rosé:      { bg: "#2e1828", color: "#c878a8" },
  Espumante: { bg: "#182038", color: "#7898c8" },
  Azeite:    { bg: "#2e2808", color: "#c8a838" },
};

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
    { label: "Todos", value: "all", key: "type" },
    { label: "Tintos", value: "Tinto", key: "type" },
    { label: "Brancos", value: "Branco", key: "type" },
    { label: "Rosés", value: "Rosé", key: "type" },
    { label: "Espumantes", value: "Espumante", key: "type" },
  ];

  const ORIGINS = [
    { label: "Todas origens", value: "all" },
    { label: "Argentina", value: "ARGENTINA" },
    { label: "Chile", value: "CHILE" },
    { label: "Portugal", value: "PORTUGAL" },
  ];

  return (
    <div style={{ background: "#0f0c08", minHeight: "100vh", color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif" }}>
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
        {ORIGINS.filter(o => o.value !== "all").map(o => (
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

      {/* Grid */}
      <div style={{ padding: "0.5rem 1.5rem 3rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {filtered.length === 0 && (
          <p style={{ color: "#5a4e38", padding: "2rem 0", gridColumn: "1/-1", textAlign: "center" }}>
            Nenhum rótulo encontrado.
          </p>
        )}
        {filtered.map(w => {
          const bs = BADGE_STYLE[w.type] || BADGE_STYLE.Tinto;
          return (
            <div key={w.id} style={{ background: "#1a1510", border: "0.5px solid #2e2418", borderRadius: 10, padding: "1rem", display: "flex", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#2a1218", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {TYPE_ICON[w.type] || "🍾"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#e8e0d0", lineHeight: 1.3, marginBottom: 4 }}>{w.name}</p>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 3, fontWeight: 500, background: bs.bg, color: bs.color }}>
                    {w.type}
                  </span>
                  {w.promo && <span style={{ fontSize: 9, letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "#3a2808", color: "#c89838", textTransform: "uppercase" }}>Promoção</span>}
                  {w.tags?.includes("new") && <span style={{ fontSize: 9, letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "#182030", color: "#6888c8", textTransform: "uppercase" }}>Novidade</span>}
                  <span style={{ fontSize: 10, color: "#5a4e38", textTransform: "uppercase", letterSpacing: 1 }}>{w.origin}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  {w.promo ? (
                    <>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#c89838" }}>
                        R$ {w.promo.toLocaleString("pt-BR")}
                      </span>
                      <span style={{ fontSize: 11, color: "#5a4e38", textDecoration: "line-through" }}>
                        R$ {w.price.toLocaleString("pt-BR")}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#e8d8b8" }}>
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
