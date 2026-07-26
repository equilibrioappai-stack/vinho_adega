import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWines } from "../components/WineContext";
import { C, FONT, SPACE } from "../theme";
import Cart from "./Cart";

const TYPE_ICON = { Tinto: "🍷", Branco: "🥂", Rosé: "🌸", Espumante: "✨", Azeite: "🫒" };
const CATEGORY_ORDER = ["Espumante", "Branco", "Rosé", "Tinto", "Azeite"];

function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function Catalog() {
  const { supplier, wines, status, cart } = useWines();
  const accent = supplier?.theme_color || C.accent;
  const [search, setSearch] = useState("");
  const [originFilter, setOriginFilter] = useState("all");

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
    return matchS && matchO;
  };

  const isSearching = search.trim().length > 0;

  const flatResults = useMemo(
    () => wines.filter(matchesFilters).sort((a, b) => a.name.localeCompare(b.name)),
    [wines, search, originFilter]
  );

  const grouped = useMemo(() => {
    const filtered = wines.filter(matchesFilters);
    return categories
      .map(cat => ({ type: cat, items: filtered.filter(w => w.type === cat).sort((a, b) => a.name.localeCompare(b.name)) }))
      .filter(g => g.items.length > 0);
  }, [wines, categories, originFilter]);

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

  const thumb = (w) => (
    w.image_url
      ? <img src={w.image_url} alt="" loading="lazy" style={{ width: 56, height: 72, objectFit: "cover", borderRadius: 4, flexShrink: 0, background: C.surface }} />
      : (
        <div style={{
          width: 56, height: 72, borderRadius: 4, flexShrink: 0, background: C.surface, border: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 0.5,
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
            <p style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{w.name}</p>
            {w.out_of_stock && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.muted, textTransform: "uppercase" }}>Esgotado</span>
            )}
            {!w.out_of_stock && w.sommelier_pick && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.gold, textTransform: "uppercase" }}>Escolha do sommelier</span>
            )}
            {!w.out_of_stock && !w.sommelier_pick && w.tags?.includes("new") && (
              <span style={{ fontSize: 10, letterSpacing: 0.4, color: C.inkSoft, textTransform: "uppercase" }}>Novo</span>
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

        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: w.promo ? accent : C.ink }}>
            R$ {(w.promo || w.price).toLocaleString("pt-BR")}
          </span>
          {w.promo && (
            <span style={{ fontSize: 11, color: C.muted, textDecoration: "line-through" }}>
              R$ {w.price.toLocaleString("pt-BR")}
            </span>
          )}
          {qtyInSelection > 0 && (
            <span style={{ fontSize: 10.5, color: accent, fontWeight: 600 }}>{qtyInSelection} na seleção</span>
          )}
          <span style={{ color: C.muted, fontSize: 15 }}>›</span>
        </div>
      </Link>
    );
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      {/* Hero editorial */}
      <div style={{ padding: `${SPACE.xxxl}px ${SPACE.md}px ${SPACE.xl}px`, textAlign: "center", borderBottom: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: SPACE.md, fontWeight: 600 }}>
          {supplier?.business_name}
        </p>
        <h1 style={{ fontFamily: FONT, fontSize: "clamp(28px, 7vw, 38px)", fontWeight: 700, color: C.ink, lineHeight: 1.2, marginBottom: SPACE.sm, letterSpacing: -0.3 }}>
          Carta de Vinhos
        </h1>
        <p style={{ fontSize: 13.5, color: C.inkSoft, maxWidth: 440, margin: "0 auto" }}>
          {origins.length > 0 && `${origins.map(o => o.charAt(0) + o.slice(1).toLowerCase()).join(", ")} · `}
          {wines.length} rótulos selecionados
        </p>
      </div>

      {/* Busca — o elemento mais importante da tela */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: C.bg, borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: `${SPACE.md}px` }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, vinícola, uva, país..."
            style={{
              width: "100%", background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
              borderRadius: 8, padding: "14px 16px", fontSize: 16, fontFamily: "inherit", outline: "none",
            }}
          />

          {!isSearching && categories.length > 1 && (
            <div style={{ display: "flex", gap: SPACE.lg, overflowX: "auto", marginTop: SPACE.md }}>
              {categories.map(cat => (
                <a
                  key={cat}
                  href={`#cat-${slugify(cat)}`}
                  style={{
                    flexShrink: 0, fontSize: 12.5, fontFamily: "inherit", textDecoration: "none",
                    color: C.inkSoft, letterSpacing: 0.3, whiteSpace: "nowrap", paddingBottom: 4,
                  }}
                >
                  {cat}s
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

      {/* Carta */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: `${SPACE.sm}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        {isSearching ? (
          flatResults.length === 0 ? (
            <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
              Nenhum rótulo encontrado.
            </p>
          ) : (
            flatResults.map(wineRow)
          )
        ) : grouped.length === 0 ? (
          <p style={{ color: C.muted, padding: `${SPACE.xxl}px 0`, textAlign: "center", fontSize: 14 }}>
            Nenhum rótulo encontrado.
          </p>
        ) : (
          grouped.map(({ type, items }) => (
            <section key={type} id={`cat-${slugify(type)}`} style={{ paddingTop: SPACE.xl, scrollMarginTop: 180 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, color: C.ink }}>{type}s</h2>
                <span style={{ fontSize: 12, color: C.muted }}>{items.length} rótulos</span>
              </div>
              {items.map(wineRow)}
            </section>
          ))
        )}
      </div>

      {/* Rodapé */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: `${SPACE.xl}px ${SPACE.md}px`, textAlign: "center" }}>
        {supplier?.whatsapp_number && (
          <p style={{ fontSize: 13, color: C.inkSoft }}>Dúvidas ou pedidos: <span style={{ color: accent, fontWeight: 600 }}>{supplier.whatsapp_number}</span></p>
        )}
      </div>

      <Cart />
    </div>
  );
}
