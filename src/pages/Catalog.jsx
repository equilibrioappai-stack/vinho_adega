import { useState, useMemo } from "react";
import { useWines } from "../components/WineContext";
import { C, FONT, SPACE } from "../theme";
import Cart from "./Cart";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };
const CATEGORY_ORDER = ["Espumante", "Branco", "Rosé", "Tinto", "Azeite"];
const DARK_INK = "#17140F";

function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function isFeaturedNow(w) {
  if (!w.featured_from || !w.featured_until) return false;
  const today = new Date().toISOString().slice(0, 10);
  return w.featured_from <= today && today <= w.featured_until;
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

  const featured = useMemo(() => wines.filter(isFeaturedNow), [wines]);

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
          <p style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: SPACE.sm }}>Catálogo não encontrado</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Confira o link recebido — este endereço não corresponde a nenhum catálogo ativo.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: SPACE.sm }}>Não foi possível carregar o catálogo</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  const winePlaceholder = (w) => (
    <div style={{
      width: "100%", aspectRatio: "3 / 4", borderRadius: 10, background: `linear-gradient(160deg, ${DARK_INK}, ${accent})`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
    }}>
      {TYPE_ICON[w.type] || "🍾"}
    </div>
  );

  const wineImage = (w) => (
    w.image_url
      ? <img src={w.image_url} alt={w.name} loading="lazy" style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", borderRadius: 10, display: "block" }} />
      : winePlaceholder(w)
  );

  const wineCard = (w, compact = false) => {
    const isPromo = !!w.promo;
    const isNew = w.tags?.includes("new");
    const qtyInCart = cart[w.id] || 0;
    return (
      <div key={w.id} style={{ width: compact ? 148 : "100%", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          {wineImage(w)}
          {(isPromo || isNew) && (
            <span style={{
              position: "absolute", top: 8, left: 8, background: isPromo ? C.gold : C.ink, color: C.surface,
              fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
              borderRadius: 4, padding: "3px 7px",
            }}>
              {isPromo ? "Promoção" : "Novidade"}
            </span>
          )}
        </div>

        <div style={{ paddingTop: SPACE.sm }}>
          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 2 }}>{w.name}</p>
          <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: SPACE.sm }}>
            {w.type} · {w.origin.charAt(0) + w.origin.slice(1).toLowerCase()}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: SPACE.xs }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {isPromo && (
                <span style={{ fontSize: 11, color: C.muted, textDecoration: "line-through" }}>
                  R$ {w.price.toLocaleString("pt-BR")}
                </span>
              )}
              <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: isPromo ? accent : C.ink }}>
                R$ {(isPromo ? w.promo : w.price).toLocaleString("pt-BR")}
              </span>
            </div>

            {qtyInCart === 0 ? (
              <button
                onClick={() => addToCart(w.id)}
                aria-label={`Adicionar ${w.name}`}
                style={{
                  background: C.ink, color: C.surface, border: "none", borderRadius: 6,
                  width: 32, height: 32, fontSize: 16, cursor: "pointer", flexShrink: 0,
                  transition: "transform 0.15s ease",
                }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.9)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >+</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
                <button onClick={() => decreaseFromCart(w.id)} style={qtyBtn}>–</button>
                <span style={{ fontSize: 12.5, minWidth: 14, textAlign: "center", fontWeight: 700 }}>{qtyInCart}</span>
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
      {/* Hero escuro */}
      <div style={{
        background: `linear-gradient(180deg, ${DARK_INK} 0%, #241F17 100%)`,
        padding: `${SPACE.xxxl}px ${SPACE.md}px ${SPACE.xxl}px`, textAlign: "center",
      }}>
        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#D9B25C", marginBottom: SPACE.sm, fontWeight: 700 }}>
          Carta de vinhos
        </p>
        <h1 style={{ fontFamily: FONT, fontSize: "clamp(30px, 8vw, 44px)", fontWeight: 800, color: "#F7F4ED", lineHeight: 1.15, marginBottom: SPACE.sm, letterSpacing: -0.5 }}>
          {supplier?.business_name}
        </h1>
        {origins.length > 0 && (
          <p style={{ fontSize: 13, color: "#C9C0AE", marginBottom: SPACE.xl, letterSpacing: 0.3 }}>
            {origins.map(o => o.charAt(0) + o.slice(1).toLowerCase()).join(" · ")}
          </p>
        )}
        {categories.length > 0 && (
          <a
            href={`#cat-${slugify(categories[0])}`}
            style={{
              display: "inline-block", background: "#D9B25C", color: DARK_INK, textDecoration: "none",
              borderRadius: 6, padding: "12px 28px", fontSize: 13.5, fontWeight: 700, letterSpacing: 0.3,
            }}
          >
            Explorar Carta
          </a>
        )}
      </div>

      {/* Destaques da semana */}
      {featured.length > 0 && (
        <div style={{ padding: `${SPACE.xl}px 0`, background: C.surface, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ padding: `0 ${SPACE.md}px`, marginBottom: SPACE.md }}>
            <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.ink }}>⭐ Destaques da semana</h2>
          </div>
          <div style={{ display: "flex", gap: SPACE.md, overflowX: "auto", padding: `0 ${SPACE.md}px ${SPACE.xs}px` }}>
            {featured.map(w => wineCard(w, true))}
          </div>
        </div>
      )}

      {/* Navegação por categoria + busca, fixa ao rolar */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: C.bg, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: `${SPACE.sm}px ${SPACE.md}px` }}>
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

      {/* Carta em grade */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: `${SPACE.md}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
              Nenhum rótulo encontrado.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: SPACE.md }}>
                {flatResults.length} rótulos encontrados
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: SPACE.lg }}>
                {flatResults.map(w => wineCard(w))}
              </div>
            </>
          )
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
            Nenhum rótulo encontrado.
          </p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ paddingTop: SPACE.xl, scrollMarginTop: 140 }}>
              <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: SPACE.xs }}>
                {TYPE_ICON[type] || "🍾"} {type}s
              </h2>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: SPACE.md }}>{items.length} rótulos</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: SPACE.lg }}>
                {items.map(w => wineCard(w))}
              </div>
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
