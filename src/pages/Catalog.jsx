import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useWines } from "../components/WineContext";
import { C, FONT, SPACE } from "../theme";
import Cart from "./Cart";

const DARK_INK = "#17140F";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌹", Espumante: "✨", Azeite: "🫒", Verde: "🍃", Acessório: "📦", Queijo: "🧀", Geleia: "🍯" };
const CATEGORY_ORDER = ["Espumante", "Branco", "Rosé", "Tinto", "Azeite"];

function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Catalog() {
  const { supplier, wines, status, cart, addToCart, decreaseFromCart, favorites } = useWines();
  const accent = supplier?.theme_color || C.accent;
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // "all" | "favorites"
  const searchRef = useRef(null);

  const origins = useMemo(() => [...new Set(wines.map(w => w.origin))].filter(Boolean).sort(), [wines]);

  const categories = useMemo(() => {
    const present = [...new Set(wines.map(w => w.type))].filter(Boolean);
    return [
      ...CATEGORY_ORDER.filter(c => present.includes(c)),
      ...present.filter(c => !CATEGORY_ORDER.includes(c)).sort(),
    ];
  }, [wines]);

  const matchesFilters = (w) => {
    const q = search.toLowerCase();
    const matchS = !q
      || w.name.toLowerCase().includes(q)
      || w.origin.toLowerCase().includes(q)
      || w.winery?.toLowerCase().includes(q)
      || w.region?.toLowerCase().includes(q)
      || w.grape?.toLowerCase().includes(q)
      || w.vintage?.toLowerCase().includes(q);
    const matchO = originFilter === "all" || w.origin === originFilter;
    const matchFav = viewMode === "all" || favorites.includes(w.id);
    return matchS && matchO && matchFav;
  };

  const isSearching = search.trim().length > 0;

  const flatResults = useMemo(
    () => wines.filter(matchesFilters).sort((a, b) => a.name.localeCompare(b.name)),
    [wines, search, originFilter, viewMode, favorites]
  );

  const grouped = useMemo(() => {
    const filtered = wines.filter(matchesFilters);
    return categories
      .map(cat => ({ type: cat, items: filtered.filter(w => w.type === cat).sort((a, b) => a.name.localeCompare(b.name)) }))
      .filter(g => g.items.length > 0);
  }, [wines, categories, originFilter, viewMode, favorites]);

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (status === "not_found") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: SPACE.sm }}>Catálogo não encontrado</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Confira o link recebido — este endereço não corresponde a nenhum catálogo ativo.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: SPACE.sm }}>Não foi possível carregar o catálogo</p>
          <p style={{ fontSize: 14, color: C.inkSoft }}>Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  const shared = {
    supplier, accent, wines, cart, addToCart, decreaseFromCart, favorites,
    search, setSearch, originFilter, setOriginFilter, viewMode, setViewMode, searchRef,
    origins, categories, isSearching, flatResults, grouped,
  };

  const layout = supplier?.layout_style || "editorial";
  if (layout === "vitrine") return <VitrineLayout {...shared} />;
  if (layout === "compacta") return <CompactaLayout {...shared} />;
  return <EditorialLayout {...shared} />;
}

function stopEvt(fn) {
  return (e) => { e.preventDefault(); e.stopPropagation(); fn(); };
}

function BottomNav({ accent, viewMode, setViewMode, categories, searchRef }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 45,
      background: C.surface, borderTop: `1px solid ${C.line}`,
      display: "flex", justifyContent: "space-around", padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
    }}>
      {[
        { label: "Início", icon: "⌂", onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
        { label: "Categorias", icon: "☰", onClick: () => document.getElementById(`cat-${slugify(categories[0] || "")}`)?.scrollIntoView({ behavior: "smooth" }) },
        { label: "Buscar", icon: "⌕", onClick: () => searchRef.current?.focus() },
        { label: "Favoritos", icon: viewMode === "favorites" ? "♥" : "♡", onClick: () => setViewMode(v => v === "favorites" ? "all" : "favorites") },
      ].map(item => (
        <button
          key={item.label}
          onClick={item.onClick}
          style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: item.label === "Favoritos" && viewMode === "favorites" ? accent : C.inkSoft,
          }}
        >
          <span style={{ fontSize: 19 }}>{item.icon}</span>
          <span style={{ fontSize: 9.5 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function SearchBar({ supplier, search, setSearch, searchRef, viewMode, setViewMode, origins, originFilter, setOriginFilter, accent }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: C.bg, borderBottom: `1px solid ${C.line}` }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: `${SPACE.md}px` }}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, vinícola, uva, país..."
          style={{
            width: "100%", background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
            borderRadius: 8, padding: "14px 16px", fontSize: 16, fontFamily: "inherit", outline: "none",
          }}
        />

        {viewMode === "favorites" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: SPACE.sm }}>
            <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>♥ Mostrando favoritos</span>
            <button onClick={() => setViewMode("all")} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Ver todos</button>
          </div>
        )}

        {origins.length > 1 && (
          <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto", marginTop: SPACE.sm }}>
            {origins.map(o => (
              <button
                key={o}
                onClick={() => setOriginFilter(originFilter === o ? "all" : o)}
                style={{
                  flexShrink: 0, background: "transparent",
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
  );
}

const miniStepBtn = {
  background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
  borderRadius: 5, width: 22, height: 22, fontSize: 12, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};

/* ---------------------------------------------------------------------- */
/* Layout 1 — Carta editorial (padrão): hero escuro, linhas com foto e ficha */
/* ---------------------------------------------------------------------- */
function EditorialLayout({ supplier, accent, wines, cart, addToCart, decreaseFromCart, search, setSearch, originFilter, setOriginFilter, viewMode, setViewMode, searchRef, origins, categories, isSearching, flatResults, grouped }) {
  const thumb = (w) => (
    w.image_url
      ? <img src={w.image_url} alt="" loading="lazy" style={{ width: 68, height: 88, objectFit: "cover", borderRadius: 5, flexShrink: 0, background: C.surface, boxShadow: "0 2px 6px rgba(30,27,23,0.12)" }} />
      : (
        <div style={{
          width: 68, height: 88, borderRadius: 5, flexShrink: 0, border: `1px solid ${C.line}`,
          background: `linear-gradient(160deg, ${C.surface}, ${C.accentSoft})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: accent, letterSpacing: 0.5,
        }}>
          {initials(w.name)}
        </div>
      )
  );

  const wineRow = (w) => {
    const qtyInSelection = cart[w.id] || 0;
    const meta = [w.origin && (w.origin.charAt(0) + w.origin.slice(1).toLowerCase()), w.region, w.winery].filter(Boolean).join(" · ");
    const secondary = [w.grape, w.vintage].filter(Boolean).join(" · ");
    return (
      <Link
        key={w.id}
        to={`vinho/${w.id}`}
        style={{
          display: "flex", gap: SPACE.md, alignItems: "flex-start", textDecoration: "none", color: "inherit",
          padding: `${SPACE.lg}px 0`, borderBottom: `1px solid ${C.line}`, opacity: w.out_of_stock ? 0.5 : 1,
        }}
      >
        {thumb(w)}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: SPACE.sm, flexWrap: "wrap" }}>
            <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{w.name}</p>
            {w.out_of_stock && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.muted, textTransform: "uppercase" }}>Esgotado</span>
            )}
            {!w.out_of_stock && w.sommelier_pick && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>★ Sommelier</span>
            )}
            {!w.out_of_stock && !w.sommelier_pick && w.tags?.includes("new") && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>Novo</span>
            )}
          </div>
          {meta && <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{meta}</p>}
          {secondary && <p style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{secondary}</p>}
          {w.description && (
            <p style={{ fontSize: 12.5, color: C.inkSoft, marginTop: SPACE.xs, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
              {w.description}
            </p>
          )}
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div>
            <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: w.promo ? accent : C.ink }}>
              R$ {(w.promo || w.price).toLocaleString("pt-BR")}
            </span>
            {w.promo && (
              <span style={{ display: "block", fontSize: 11, color: C.muted, textDecoration: "line-through" }}>
                R$ {w.price.toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {!w.out_of_stock && (
            qtyInSelection === 0 ? (
              <button
                onClick={stopEvt(() => addToCart(w.id))}
                style={{
                  background: "transparent", border: `1px solid ${accent}`, color: accent,
                  borderRadius: 20, padding: "4px 12px", fontSize: 11.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >Adicionar</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={stopEvt(() => decreaseFromCart(w.id))} style={miniStepBtn}>–</button>
                <span style={{ fontSize: 12.5, minWidth: 12, textAlign: "center", fontWeight: 700 }}>{qtyInSelection}</span>
                <button onClick={stopEvt(() => addToCart(w.id))} style={miniStepBtn}>+</button>
              </div>
            )
          )}
        </div>
      </Link>
    );
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      <div style={{
        padding: `${SPACE.xxxl}px ${SPACE.md}px ${SPACE.xxl}px`, textAlign: "center",
        ...(supplier?.hero_image_url
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(23,20,15,0.35), rgba(23,20,15,0.88)), url(${supplier.hero_image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
            }
          : { background: `linear-gradient(180deg, ${DARK_INK} 0%, #241F17 100%)` }),
      }}>
        {supplier?.logo_url ? (
          <img src={supplier.logo_url} alt={supplier.business_name} style={{ height: 52, maxWidth: 200, objectFit: "contain", marginBottom: SPACE.md }} />
        ) : (
          <p style={{ fontSize: 11.5, letterSpacing: 4, textTransform: "uppercase", color: "#D9B25C", marginBottom: SPACE.md, fontWeight: 700 }}>
            {supplier?.business_name}
          </p>
        )}
        <h1 style={{ fontFamily: FONT, fontSize: "clamp(34px, 9vw, 52px)", fontWeight: 800, color: "#F7F4ED", lineHeight: 1.1, marginBottom: SPACE.md, letterSpacing: -0.8 }}>
          Carta de Vinhos
        </h1>
        <div style={{ width: 48, height: 3, background: "#D9B25C", margin: `0 auto ${SPACE.md}px` }} />
        <p style={{ fontSize: 14.5, color: "#D8D0C0", maxWidth: 440, margin: "0 auto", marginBottom: SPACE.xl }}>
          {origins.length > 0 && `${origins.map(o => o.charAt(0) + o.slice(1).toLowerCase()).join(", ")} · `}
          {wines.length} rótulos selecionados
        </p>

        {categories.length > 1 && (
          <div style={{ display: "flex", gap: SPACE.lg, flexWrap: "wrap", justifyContent: "center", maxWidth: 480, margin: "0 auto" }}>
            {categories.map(cat => (
              <a
                key={cat}
                href={`#cat-${slugify(cat)}`}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <span style={{
                  width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(217,178,92,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
                }}>
                  {TYPE_ICON[cat] || "🍾"}
                </span>
                <span style={{ fontSize: 10.5, color: "#D8D0C0", letterSpacing: 0.3 }}>{cat}s</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <SearchBar {...{ supplier, search, setSearch, searchRef, viewMode, setViewMode, origins, originFilter, setOriginFilter, accent }} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: `${SPACE.sm}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum rótulo encontrado.</p>
          ) : (
            flatResults.map(wineRow)
          )
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum rótulo encontrado.</p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ paddingTop: SPACE.xxl, scrollMarginTop: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: 2 }}>
                <span style={{ fontSize: 18 }}>{TYPE_ICON[type] || "🍾"}</span>
                <h2 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 800, color: C.ink }}>{type}s</h2>
                <span style={{ flex: 1, height: 1, background: C.line, marginLeft: SPACE.sm }} />
                <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{items.length}</span>
              </div>
              {items.map(wineRow)}
            </section>
          ))
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: `${SPACE.xl}px ${SPACE.md}px ${SPACE.xxxl}px`, textAlign: "center" }}>
        {supplier?.whatsapp_number && (
          <p style={{ fontSize: 13, color: C.inkSoft }}>Dúvidas ou pedidos: <span style={{ color: accent, fontWeight: 600 }}>{supplier.whatsapp_number}</span></p>
        )}
      </div>

      <BottomNav accent={accent} viewMode={viewMode} setViewMode={setViewMode} categories={categories} searchRef={searchRef} />
      <Cart />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Layout 2 — Vitrine: grid de cards com foto em destaque                 */
/* ---------------------------------------------------------------------- */
function VitrineLayout({ supplier, accent, wines, cart, addToCart, decreaseFromCart, search, setSearch, originFilter, setOriginFilter, viewMode, setViewMode, searchRef, origins, categories, isSearching, flatResults, grouped }) {
  const card = (w) => {
    const qtyInSelection = cart[w.id] || 0;
    return (
      <Link
        key={w.id}
        to={`vinho/${w.id}`}
        style={{ textDecoration: "none", color: "inherit", opacity: w.out_of_stock ? 0.5 : 1 }}
      >
        <div style={{ position: "relative", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1", background: `linear-gradient(160deg, ${C.surface}, ${C.accentSoft})` }}>
            {w.image_url ? (
              <img src={w.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: accent }}>
                {initials(w.name)}
              </div>
            )}
            {w.out_of_stock && (
              <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(30,27,23,0.85)", color: "#fff", fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.4, padding: "3px 7px", borderRadius: 4 }}>Esgotado</span>
            )}
            {!w.out_of_stock && w.sommelier_pick && (
              <span style={{ position: "absolute", top: 8, left: 8, background: C.gold, color: "#fff", fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.4, padding: "3px 7px", borderRadius: 4, fontWeight: 700 }}>★ Sommelier</span>
            )}
            {w.promo && (
              <span style={{ position: "absolute", top: 8, right: 8, background: accent, color: "#fff", fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.4, padding: "3px 7px", borderRadius: 4, fontWeight: 700 }}>Promo</span>
            )}
          </div>

          <div style={{ padding: "10px 12px 12px" }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 34 }}>
              {w.name}
            </p>
            <p style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              {[w.origin && (w.origin.charAt(0) + w.origin.slice(1).toLowerCase()), w.region].filter(Boolean).join(" · ")}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: w.promo ? accent : C.ink }}>
                  R$ {(w.promo || w.price).toLocaleString("pt-BR")}
                </span>
                {w.promo && (
                  <span style={{ display: "block", fontSize: 10.5, color: C.muted, textDecoration: "line-through" }}>
                    R$ {w.price.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              {!w.out_of_stock && (
                qtyInSelection === 0 ? (
                  <button
                    onClick={stopEvt(() => addToCart(w.id))}
                    style={{ background: accent, border: "none", color: "#fff", borderRadius: "50%", width: 30, height: 30, fontSize: 16, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                  >+</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <button onClick={stopEvt(() => decreaseFromCart(w.id))} style={miniStepBtn}>–</button>
                    <span style={{ fontSize: 12, minWidth: 10, textAlign: "center", fontWeight: 700 }}>{qtyInSelection}</span>
                    <button onClick={stopEvt(() => addToCart(w.id))} style={miniStepBtn}>+</button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const grid = (items) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: SPACE.sm }}>
      {items.map(card)}
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      <div style={{
        padding: `${SPACE.xxl}px ${SPACE.md}px ${SPACE.xl}px`, textAlign: "center",
        ...(supplier?.hero_image_url
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(23,20,15,0.25), rgba(23,20,15,0.75)), url(${supplier.hero_image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
            }
          : { background: `linear-gradient(180deg, ${DARK_INK} 0%, #241F17 100%)` }),
      }}>
        {supplier?.logo_url ? (
          <img src={supplier.logo_url} alt={supplier.business_name} style={{ height: 44, maxWidth: 180, objectFit: "contain", marginBottom: SPACE.sm }} />
        ) : (
          <p style={{ fontSize: 18, fontWeight: 800, color: "#F7F4ED", marginBottom: 2 }}>{supplier?.business_name}</p>
        )}
        <p style={{ fontSize: 13, color: "#D8D0C0" }}>{wines.length} produtos disponíveis</p>
      </div>

      <SearchBar {...{ supplier, search, setSearch, searchRef, viewMode, setViewMode, origins, originFilter, setOriginFilter, accent }} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: `${SPACE.md}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum produto encontrado.</p>
          ) : grid(flatResults)
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum produto encontrado.</p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ marginBottom: SPACE.xl, scrollMarginTop: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm }}>
                <span style={{ fontSize: 16 }}>{TYPE_ICON[type] || "🍾"}</span>
                <h2 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: C.ink }}>{type}s</h2>
                <span style={{ fontSize: 11.5, color: C.muted }}>({items.length})</span>
              </div>
              {grid(items)}
            </section>
          ))
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: `${SPACE.xl}px ${SPACE.md}px ${SPACE.xxxl}px`, textAlign: "center" }}>
        {supplier?.whatsapp_number && (
          <p style={{ fontSize: 13, color: C.inkSoft }}>Dúvidas ou pedidos: <span style={{ color: accent, fontWeight: 600 }}>{supplier.whatsapp_number}</span></p>
        )}
      </div>

      <BottomNav accent={accent} viewMode={viewMode} setViewMode={setViewMode} categories={categories} searchRef={searchRef} />
      <Cart />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Layout 3 — Compacta: lista densa sem fotos, pra catálogos grandes      */
/* ---------------------------------------------------------------------- */
function CompactaLayout({ supplier, accent, wines, cart, addToCart, decreaseFromCart, search, setSearch, originFilter, setOriginFilter, viewMode, setViewMode, searchRef, origins, categories, isSearching, flatResults, grouped }) {
  const line = (w) => {
    const qtyInSelection = cart[w.id] || 0;
    return (
      <Link
        key={w.id}
        to={`vinho/${w.id}`}
        style={{
          display: "flex", gap: SPACE.sm, alignItems: "center", textDecoration: "none", color: "inherit",
          padding: "9px 0", borderBottom: `1px solid ${C.line}`, opacity: w.out_of_stock ? 0.5 : 1,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</p>
            {w.out_of_stock && <span style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", flexShrink: 0 }}>Esgotado</span>}
            {!w.out_of_stock && w.sommelier_pick && <span style={{ fontSize: 9, color: C.gold, fontWeight: 700, flexShrink: 0 }}>★</span>}
          </div>
          <p style={{ fontSize: 10.5, color: C.muted }}>
            {[w.origin && (w.origin.charAt(0) + w.origin.slice(1).toLowerCase()), w.grape, w.vintage].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: w.promo ? accent : C.ink }}>
              R$ {(w.promo || w.price).toLocaleString("pt-BR")}
            </span>
            {w.promo && (
              <span style={{ display: "block", fontSize: 9.5, color: C.muted, textDecoration: "line-through" }}>
                R$ {w.price.toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {!w.out_of_stock && (
            qtyInSelection === 0 ? (
              <button
                onClick={stopEvt(() => addToCart(w.id))}
                style={{ background: "none", border: `1px solid ${accent}`, color: accent, borderRadius: "50%", width: 24, height: 24, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              >+</button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={stopEvt(() => decreaseFromCart(w.id))} style={miniStepBtn}>–</button>
                <span style={{ fontSize: 11.5, minWidth: 10, textAlign: "center", fontWeight: 700 }}>{qtyInSelection}</span>
                <button onClick={stopEvt(() => addToCart(w.id))} style={miniStepBtn}>+</button>
              </div>
            )
          )}
        </div>
      </Link>
    );
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      <div style={{ padding: `${SPACE.lg}px ${SPACE.md}px`, textAlign: "center", background: C.surface, borderBottom: `1px solid ${C.line}` }}>
        {supplier?.logo_url ? (
          <img src={supplier.logo_url} alt={supplier.business_name} style={{ height: 36, maxWidth: 160, objectFit: "contain", marginBottom: 4 }} />
        ) : (
          <p style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{supplier?.business_name}</p>
        )}
        <p style={{ fontSize: 11.5, color: C.muted }}>{wines.length} itens na carta</p>
      </div>

      <SearchBar {...{ supplier, search, setSearch, searchRef, viewMode, setViewMode, origins, originFilter, setOriginFilter, accent }} />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: `0 ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum item encontrado.</p>
          ) : (
            flatResults.map(line)
          )
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>Nenhum item encontrado.</p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ paddingTop: SPACE.lg, scrollMarginTop: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <h2 style={{ fontSize: 12.5, fontWeight: 800, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>{type}s</h2>
                <span style={{ flex: 1, height: 1, background: C.line }} />
                <span style={{ fontSize: 10.5, color: C.muted }}>{items.length}</span>
              </div>
              {items.map(line)}
            </section>
          ))
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: `${SPACE.lg}px ${SPACE.md}px ${SPACE.xxxl}px`, textAlign: "center" }}>
        {supplier?.whatsapp_number && (
          <p style={{ fontSize: 12.5, color: C.inkSoft }}>Dúvidas ou pedidos: <span style={{ color: accent, fontWeight: 600 }}>{supplier.whatsapp_number}</span></p>
        )}
      </div>

      <BottomNav accent={accent} viewMode={viewMode} setViewMode={setViewMode} categories={categories} searchRef={searchRef} />
      <Cart />
    </div>
  );
}
