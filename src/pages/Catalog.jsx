import { useState, useMemo } from "react";
import { useWines } from "../components/WineContext";
import { C, FONT, SPACE } from "../theme";
import Cart from "./Cart";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };
const CATEGORY_ORDER = ["Espumante", "Branco", "Rosé", "Tinto", "Azeite"];

function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

export default function Catalog() {
  const { supplier, wines, status, cart, addToCart, decreaseFromCart } = useWines();
  const accent = supplier?.theme_color || C.accent;
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("all");
  const [sort, setSort] = useState("name");

  const origins = useMemo(() => [...new Set(wines.map(w => w.origin))].filter(Boolean).sort(), [wines]);

  const categories = useMemo(() => {
    const present = [...new Set(wines.map(w => w.type))].filter(Boolean);
    return [
      ...CATEGORY_ORDER.filter(c => present.includes(c)),
      ...present.filter(c => !CATEGORY_ORDER.includes(c)).sort(),
    ];
  }, [wines]);

  const sortFn = (a, b) => {
    if (sort === "price-asc") return (a.promo || a.price) - (b.promo || b.price);
    if (sort === "price-desc") return (b.promo || b.price) - (a.promo || a.price);
    if (sort === "promo") return (b.promo ? 1 : 0) - (a.promo ? 1 : 0);
    return a.name.localeCompare(b.name);
  };

  const matchesFilters = (w) => {
    const q = search.toLowerCase();
    const matchS = !q || w.name.toLowerCase().includes(q) || w.origin.toLowerCase().includes(q);
    const matchO = originFilter === "all" || w.origin === originFilter;
    return matchS && matchO;
  };

  const isSearching = search.trim().length > 0;

  const flatResults = useMemo(
    () => wines.filter(matchesFilters).sort(sortFn),
    [wines, search, originFilter, sort]
  );

  const grouped = useMemo(() => {
    const filtered = wines.filter(matchesFilters);
    return categories
      .map(cat => ({ type: cat, items: filtered.filter(w => w.type === cat).sort(sortFn) }))
      .filter(g => g.items.length > 0);
  }, [wines, categories, originFilter, sort]);

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (status === "not_found") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: SPACE.sm }}>Catálogo não encontrado</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Confira o link recebido — este endereço não corresponde a nenhum catálogo ativo.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: SPACE.sm }}>Não foi possível carregar o catálogo</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  const wineCard = (w) => {
    const isPromo = !!w.promo;
    const isNew = w.tags?.includes("new");
    const qtyInCart = cart[w.id] || 0;
    return (
      <div
        key={w.id}
        style={{
          display: "flex", gap: SPACE.md, alignItems: "flex-start",
          padding: `${SPACE.lg}px 0`, borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ fontSize: 22, lineHeight: 1, marginTop: 3, flexShrink: 0, width: 26, textAlign: "center", opacity: 0.85 }}>
          {TYPE_ICON[w.type] || "🍾"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: SPACE.sm, flexWrap: "wrap" }}>
            <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{w.name}</p>
            {isPromo && (
              <span style={{ fontSize: 10, letterSpacing: 0.6, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>
                Promoção
              </span>
            )}
            {isNew && !isPromo && (
              <span style={{ fontSize: 10, letterSpacing: 0.6, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>
                Novidade
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, marginBottom: SPACE.md }}>
            {w.type} · {w.origin.charAt(0) + w.origin.slice(1).toLowerCase()}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: SPACE.sm }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: SPACE.sm }}>
              {isPromo ? (
                <>
                  <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: accent }}>
                    R$ {w.promo.toLocaleString("pt-BR")}
                  </span>
                  <span style={{ fontSize: 12.5, color: C.muted, textDecoration: "line-through" }}>
                    R$ {w.price.toLocaleString("pt-BR")}
                  </span>
                </>
              ) : (
                <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: C.ink }}>
                  R$ {w.price.toLocaleString("pt-BR")}
                </span>
              )}
            </div>

            {qtyInCart === 0 ? (
              <button
                onClick={() => addToCart(w.id)}
                style={{
                  background: C.ink, color: C.surface, border: "none",
                  borderRadius: 6, padding: "8px 16px", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.2,
                  transition: "transform 0.15s ease, background 0.15s ease",
                }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                Adicionar
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
                <button onClick={() => decreaseFromCart(w.id)} style={qtyBtn}>–</button>
                <span style={{ fontSize: 13.5, minWidth: 16, textAlign: "center", fontWeight: 600 }}>{qtyInCart}</span>
                <button onClick={() => addToCart(w.id)} style={qtyBtn}>+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      {/* Hero */}
      <div style={{ padding: `${SPACE.xxxl}px ${SPACE.md}px ${SPACE.xxl}px`, textAlign: "center", borderBottom: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: SPACE.sm, fontWeight: 600 }}>
          Carta de vinhos
        </p>
        <h1 style={{ fontFamily: FONT, fontSize: "clamp(30px, 8vw, 44px)", fontWeight: 800, color: C.ink, lineHeight: 1.15, marginBottom: SPACE.sm, letterSpacing: -0.5 }}>
          {supplier?.business_name}
        </h1>
        {origins.length > 0 && (
          <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: SPACE.xl, letterSpacing: 0.3 }}>
            {origins.map(o => o.charAt(0) + o.slice(1).toLowerCase()).join(" · ")}
          </p>
        )}
        {categories.length > 0 && (
          <a
            href={`#cat-${slugify(categories[0])}`}
            style={{
              display: "inline-block", background: C.ink, color: C.surface, textDecoration: "none",
              borderRadius: 6, padding: "12px 28px", fontSize: 13.5, fontWeight: 600, letterSpacing: 0.3,
            }}
          >
            Explorar Carta
          </a>
        )}
      </div>

      {/* Navegação por categoria + busca, fixa ao rolar */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: C.bg, borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: `${SPACE.sm}px ${SPACE.md}px` }}>
          <div style={{ display: "flex", gap: SPACE.sm, marginBottom: SPACE.sm }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar rótulo..."
              style={{
                flex: 1, minWidth: 100, background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
                borderRadius: 6, padding: "9px 12px", fontSize: 16, fontFamily: "inherit", outline: "none"
              }}
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 6, padding: "9px 8px", fontSize: 13, fontFamily: "inherit" }}
            >
              <option value="name">Nome A–Z</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="promo">Promoções</option>
            </select>
          </div>

          {!isSearching && categories.length > 1 && (
            <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto", paddingBottom: 2 }}>
              {categories.map(cat => (
                <a
                  key={cat}
                  href={`#cat-${slugify(cat)}`}
                  style={{
                    flexShrink: 0, fontSize: 12, fontFamily: "inherit", textDecoration: "none",
                    color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: 20, padding: "5px 13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {TYPE_ICON[cat] || "🍾"} {cat}s
                </a>
              ))}
            </div>
          )}

          {origins.length > 1 && (
            <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto", marginTop: SPACE.sm }}>
              {origins.map(o => (
                <button
                  key={o}
                  onClick={() => setOriginFilter(originFilter === o ? "all" : o)}
                  style={{
                    flexShrink: 0, background: originFilter === o ? C.accentSoft : "transparent",
                    border: `1px solid ${originFilter === o ? accent : C.line}`,
                    color: originFilter === o ? accent : C.muted,
                    borderRadius: 20, padding: "4px 12px", fontSize: 11.5, fontFamily: "inherit",
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >{o.charAt(0) + o.slice(1).toLowerCase()}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Carta */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: `${SPACE.sm}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
              Nenhum rótulo encontrado.
            </p>
          ) : (
            <>
              <p style={{ padding: `${SPACE.md}px 0 0`, fontSize: 12, color: C.muted }}>
                {flatResults.length} rótulos encontrados
              </p>
              {flatResults.map(wineCard)}
            </>
          )
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
            Nenhum rótulo encontrado.
          </p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ paddingTop: SPACE.xl, scrollMarginTop: 120 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: SPACE.xs }}>
                {TYPE_ICON[type] || "🍾"} {type}s
              </h2>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: SPACE.sm }}>{items.length} rótulos</p>
              {items.map(wineCard)}
            </section>
          ))
        )}
      </div>

      {/* Rodapé */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: `${SPACE.xl}px ${SPACE.md}px`, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: C.muted }}>Envio para todo o Brasil via transportadora · Pagamento antecipado via PIX</p>
        {supplier?.whatsapp_number && (
          <p style={{ fontSize: 13, color: accent, marginTop: SPACE.xs, fontWeight: 600 }}>{supplier.whatsapp_number}</p>
        )}
      </div>

      <Cart />
    </div>
  );
}

const qtyBtn = {
  background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
  borderRadius: 6, width: 26, height: 26, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
