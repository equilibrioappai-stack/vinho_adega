import { useParams, Link } from "react-router-dom";
import { useWines } from "../components/WineContext";
import { C, FONT, SPACE } from "../theme";
import Cart from "./Cart";

function initials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const row = (label, value) => value ? (
  <div style={{ display: "flex", justifyContent: "space-between", padding: `${SPACE.sm}px 0`, borderBottom: `1px solid ${C.line}` }}>
    <span style={{ fontSize: 12.5, color: C.muted }}>{label}</span>
    <span style={{ fontSize: 13, color: C.ink, fontWeight: 500, textAlign: "right" }}>{value}</span>
  </div>
) : null;

export default function WineDetail() {
  const { supplierSlug, wineId } = useParams();
  const { supplier, wines, status, cart, addToCart, decreaseFromCart } = useWines();
  const accent = supplier?.theme_color || C.accent;

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (status === "not_found" || status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: SPACE.md }}>
        <p style={{ fontSize: 16, color: C.ink }}>Catálogo indisponível.</p>
      </div>
    );
  }

  const w = wines.find(x => String(x.id) === String(wineId));

  if (!w) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, padding: SPACE.md }}>
        <Link to={`/catalogo/${supplierSlug}`} style={{ fontSize: 13, color: C.inkSoft }}>← Voltar à carta</Link>
        <p style={{ textAlign: "center", marginTop: SPACE.xxl, color: C.muted, fontSize: 14 }}>Rótulo não encontrado.</p>
      </div>
    );
  }

  const qtyInSelection = cart[w.id] || 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: `${SPACE.md}px ${SPACE.md}px ${SPACE.xxxl}px` }}>
        <Link to={`/catalogo/${supplierSlug}`} style={{ fontSize: 13, color: C.inkSoft, textDecoration: "none", display: "inline-block", marginBottom: SPACE.lg }}>
          ← Voltar à carta
        </Link>

        <div style={{ display: "flex", gap: SPACE.lg, alignItems: "flex-start", marginBottom: SPACE.xl }}>
          {w.image_url ? (
            <img src={w.image_url} alt="" style={{ width: 120, height: 156, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: C.surface }} />
          ) : (
            <div style={{
              width: 120, height: 156, borderRadius: 6, flexShrink: 0, background: C.surface, border: `1px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: C.muted,
            }}>
              {initials(w.name)}
            </div>
          )}

          <div style={{ flex: 1, paddingTop: SPACE.xs }}>
            {w.out_of_stock && <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Esgotado</p>}
            {!w.out_of_stock && w.sommelier_pick && <p style={{ fontSize: 11, color: C.gold, textTransform: "uppercase", marginBottom: 4 }}>Escolha do sommelier</p>}
            <h1 style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: C.ink, lineHeight: 1.25, marginBottom: SPACE.xs }}>{w.name}</h1>
            {w.winery && <p style={{ fontSize: 13, color: C.inkSoft }}>{w.winery}</p>}
            <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              {[w.origin && (w.origin.charAt(0) + w.origin.slice(1).toLowerCase()), w.region].filter(Boolean).join(" · ")}
            </p>

            <div style={{ marginTop: SPACE.md }}>
              {w.promo && (
                <span style={{ fontSize: 12.5, color: C.muted, textDecoration: "line-through", marginRight: 8 }}>
                  R$ {w.price.toLocaleString("pt-BR")}
                </span>
              )}
              <span style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: w.promo ? accent : C.ink }}>
                R$ {(w.promo || w.price).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        {w.description && (
          <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.7, marginBottom: SPACE.xl }}>{w.description}</p>
        )}

        <div style={{ marginBottom: SPACE.xl }}>
          {row("Uva", w.grape)}
          {row("Safra", w.vintage)}
          {row("Teor alcoólico", w.abv)}
          {row("Harmonização", w.food_pairing)}
          {row("Temperatura de serviço", w.serving_temp)}
          {row("Tipo", w.type)}
        </div>

        {!w.out_of_stock && (
          <div style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
            {qtyInSelection === 0 ? (
              <button
                onClick={() => addToCart(w.id)}
                style={{
                  background: C.ink, color: C.surface, border: "none", borderRadius: 6,
                  padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >Adicionar à minha seleção</button>
            ) : (
              <>
                <button onClick={() => decreaseFromCart(w.id)} style={stepBtn}>–</button>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{qtyInSelection}</span>
                <button onClick={() => addToCart(w.id)} style={stepBtn}>+</button>
                <span style={{ fontSize: 12.5, color: C.inkSoft }}>na sua seleção</span>
              </>
            )}
          </div>
        )}
      </div>

      <Cart />
    </div>
  );
}

const stepBtn = {
  background: C.surface, border: `1px solid ${C.line}`, color: C.ink,
  borderRadius: 6, width: 34, height: 34, fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
