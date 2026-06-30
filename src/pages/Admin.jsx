import { useState } from "react";
import { useWines } from "../components/WineContext";
import { C, FONT } from "../theme";

const ADMIN_PASSWORD = "adega2025";

const EMPTY_FORM = { name: "", type: "Tinto", origin: "ARGENTINA", price: "", promo: "", tags: [] };

const label = (text) => (
  <span style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>
    {text}
  </span>
);

export default function Admin() {
  const { wines, addWine, updateWine, deleteWine } = useWines();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  const filtered = wines.filter(w => {
    const q = search.toLowerCase();
    const matchS = !q || w.name.toLowerCase().includes(q);
    const matchT = typeFilter === "all" || w.type === typeFilter;
    return matchS && matchT;
  });

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ mode: "add" }); };
  const openEdit = (w) => {
    setForm({ name: w.name, type: w.type, origin: w.origin, price: w.price, promo: w.promo || "", tags: w.tags || [] });
    setModal({ mode: "edit", id: w.id });
  };

  const save = () => {
    if (!form.name.trim() || !form.price) return;
    const wine = {
      name: form.name.trim(), type: form.type, origin: form.origin,
      price: parseFloat(form.price),
      promo: form.promo ? parseFloat(form.promo) : null,
      tags: form.tags,
    };
    if (modal.mode === "add") addWine(wine);
    else updateWine(modal.id, wine);
    setModal(null);
  };

  const toggleTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));
  };

  const stats = {
    total: wines.length,
    promos: wines.filter(w => w.promo).length,
    novidades: wines.filter(w => w.tags?.includes("new")).length,
  };

  const fieldInput = {
    width: "100%", background: C.bg, border: `1px solid ${C.line}`,
    borderRadius: 7, padding: "9px 11px", fontSize: 13.5, fontFamily: "inherit",
    color: C.ink, outline: "none", boxSizing: "border-box",
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "1rem" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "2rem 1.75rem", width: "100%", maxWidth: 360 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 8, fontWeight: 700 }}>
            Adega Selecionada
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Área restrita</p>
          <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: "1.75rem" }}>Acesso exclusivo para o fornecedor</p>

          {label("Senha")}
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="••••••••"
            style={{ ...fieldInput, border: `1px solid ${pwError ? C.danger : C.line}`, marginBottom: 6 }}
          />
          {pwError && <p style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>Senha incorreta.</p>}
          <button
            onClick={login}
            style={{ width: "100%", background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", marginTop: 6 }}
          >Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 3 }}>
            Adega Selecionada
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Painel do fornecedor</p>
        </div>
        <button
          onClick={() => setAuthed(false)}
          style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 7, padding: "6px 13px", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}
        >Sair</button>
      </div>

      <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.25rem" }}>
          {[["Rótulos", stats.total], ["Em promoção", stats.promos], ["Novidades", stats.novidades]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "0.9rem 1rem" }}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{lbl}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rótulo..."
            style={{ flex: 1, minWidth: 140, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 13.5, fontFamily: "inherit", color: C.ink, outline: "none" }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 13, fontFamily: "inherit", color: C.ink }}
          >
            <option value="all">Todos os tipos</option>
            {["Tinto","Branco","Rosé","Espumante","Azeite"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={openAdd}
            style={{ background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
          >+ Novo rótulo</button>
        </div>

        {/* Lista de rótulos (mobile-first: não usa table) */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Cabeçalho visível só em desktop */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 80px 80px 64px", gap: 0, borderBottom: `1px solid ${C.line}`, padding: "9px 14px", background: C.bg }}>
            {["Rótulo","Tipo","Origem","Preço","Promo",""].map(h => (
              <span key={h} style={{ fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 && (
            <p style={{ padding: "2rem", textAlign: "center", color: C.muted, fontSize: 13.5 }}>Nenhum rótulo encontrado.</p>
          )}

          {filtered.map((w, i) => (
            <div
              key={w.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 80px 80px 64px",
                gap: 0,
                padding: "10px 14px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.line}` : "none",
                alignItems: "center",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {w.name}
                </p>
                <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
                  {w.tags?.includes("new") && (
                    <span style={{ fontSize: 9.5, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>Novidade</span>
                  )}
                  {w.promo && (
                    <span style={{ fontSize: 9.5, color: C.gold, fontWeight: 700, textTransform: "uppercase" }}>Promoção</span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 12.5, color: C.inkSoft }}>{w.type}</span>
              <span style={{ fontSize: 11.5, color: C.muted }}>{w.origin.charAt(0) + w.origin.slice(1).toLowerCase()}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>R$ {w.price}</span>
              <span style={{ fontSize: 13, color: w.promo ? C.accent : C.muted }}>
                {w.promo ? `R$ ${w.promo}` : "—"}
              </span>
              <div style={{ display: "flex", gap: 5 }}>
                <button
                  onClick={() => openEdit(w)}
                  style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 12, color: C.inkSoft }}
                  title="Editar"
                >✏️</button>
                <button
                  onClick={() => setConfirmDelete(w)}
                  style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 12, color: C.inkSoft }}
                  title="Excluir"
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal add/edit */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,31,26,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
          <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "1.5rem 1.25rem 2rem", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: "1.25rem" }}>
              {modal.mode === "add" ? "Novo rótulo" : "Editar rótulo"}
            </p>

            <div style={{ marginBottom: 12 }}>
              {label("Nome")}
              <input style={fieldInput} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Alamos Malbec" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                {label("Tipo")}
                <select style={fieldInput} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["Tinto","Branco","Rosé","Espumante","Azeite"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {label("Origem")}
                <select style={fieldInput} value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>
                  <option value="ARGENTINA">Argentina</option>
                  <option value="CHILE">Chile</option>
                  <option value="PORTUGAL">Portugal</option>
                </select>
              </div>
              <div>
                {label("Preço (R$)")}
                <input style={fieldInput} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                {label("Promoção (R$)")}
                <input style={fieldInput} type="number" value={form.promo} onChange={e => setForm(f => ({ ...f, promo: e.target.value }))} placeholder="Deixe vazio" min="0" />
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              {label("Tags")}
              <div style={{ display: "flex", gap: 8 }}>
                {["new","promo"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "5px 14px", borderRadius: 20, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                      background: form.tags.includes(tag) ? C.ink : "transparent",
                      border: `1px solid ${form.tags.includes(tag) ? C.ink : C.line}`,
                      color: form.tags.includes(tag) ? C.surface : C.inkSoft
                    }}
                  >{tag === "new" ? "Novidade" : "Promoção"}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: "1rem", borderTop: `1px solid ${C.line}` }}>
              <button
                onClick={() => setModal(null)}
                style={{ flex: 1, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", color: C.inkSoft }}
              >Cancelar</button>
              <button
                onClick={save}
                style={{ flex: 2, background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
              >Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,31,26,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "1.5rem 1.25rem 2rem", width: "100%", maxWidth: 520 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Confirmar exclusão</p>
            <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: "1.5rem" }}>
              Remover <strong style={{ color: C.ink }}>{confirmDelete.name}</strong> do catálogo? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", color: C.inkSoft }}
              >Cancelar</button>
              <button
                onClick={() => { deleteWine(confirmDelete.id); setConfirmDelete(null); }}
                style={{ flex: 1, background: C.danger, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
