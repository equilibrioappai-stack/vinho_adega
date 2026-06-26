import { useState } from "react";
import { useWines } from "../components/WineContext";

const ADMIN_PASSWORD = "adega2025";

const EMPTY_FORM = { name: "", type: "Tinto", origin: "ARGENTINA", price: "", promo: "", tags: [] };

export default function Admin() {
  const { wines, addWine, updateWine, deleteWine } = useWines();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | { mode: "add"|"edit", wine }
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

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ mode: "add" });
  };

  const openEdit = (w) => {
    setForm({ name: w.name, type: w.type, origin: w.origin, price: w.price, promo: w.promo || "", tags: w.tags || [] });
    setModal({ mode: "edit", id: w.id });
  };

  const save = () => {
    if (!form.name.trim() || !form.price) return;
    const wine = {
      name: form.name.trim(),
      type: form.type,
      origin: form.origin,
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

  const inputStyle = {
    width: "100%", background: "#f8f6f2", border: "0.5px solid #d8d0c0",
    borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", color: "#1a1208", outline: "none"
  };

  const selectStyle = { ...inputStyle };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0c08", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: "#1a1510", border: "0.5px solid #3a2e1e", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 340 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#f0e8d8", marginBottom: 6 }}>Área restrita</p>
          <p style={{ fontSize: 12, color: "#7a6848", marginBottom: "1.5rem" }}>Acesso exclusivo para o fornecedor</p>
          <label style={{ fontSize: 11, color: "#7a6848", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Senha</label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="••••••••"
            style={{ width: "100%", background: "#1e1810", border: "0.5px solid " + (pwError ? "#c84040" : "#3a2e1e"), color: "#e8e0d0", borderRadius: 6, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 8 }}
          />
          {pwError && <p style={{ fontSize: 11, color: "#c87070", marginBottom: 8 }}>Senha incorreta.</p>}
          <button
            onClick={login}
            style={{ width: "100%", background: "#a06420", border: "none", color: "#fff", borderRadius: 6, padding: "10px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" }}
          >Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f1eb", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1208", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#f0e8d8", fontWeight: 400 }}>Painel do fornecedor</p>
          <p style={{ fontSize: 11, color: "#7a6848" }}>Gerencie rótulos, preços e promoções</p>
        </div>
        <button
          onClick={() => setAuthed(false)}
          style={{ background: "none", border: "0.5px solid #3a2e1e", color: "#7a6848", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}
        >Sair</button>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
          {[["Total", stats.total], ["Promoções", stats.promos], ["Novidades", stats.novidades]].map(([label, val]) => (
            <div key={label} style={{ background: "#fff", border: "0.5px solid #ddd5c0", borderRadius: 8, padding: "0.75rem 1rem" }}>
              <p style={{ fontSize: 11, color: "#8a7a60", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 24, fontWeight: 500, color: "#1a1208" }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar rótulo..."
            style={{ flex: 1, minWidth: 140, background: "#fff", border: "0.5px solid #d8d0c0", borderRadius: 6, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", color: "#1a1208", outline: "none" }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: "#fff", border: "0.5px solid #d8d0c0", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontFamily: "inherit", color: "#1a1208" }}
          >
            <option value="all">Todos os tipos</option>
            {["Tinto","Branco","Rosé","Espumante","Azeite"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={openAdd}
            style={{ background: "#a06420", border: "none", color: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" }}
          >+ Novo rótulo</button>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid #d8d0c0", borderRadius: 10, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f4ec", borderBottom: "0.5px solid #d8d0c0" }}>
                {["Rótulo","Tipo","Origem","Preço","Promoção",""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 500, color: "#8a7a60", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#8a7a60" }}>Nenhum rótulo encontrado.</td></tr>
              )}
              {filtered.map(w => (
                <tr key={w.id} style={{ borderBottom: "0.5px solid #ece8e0" }}>
                  <td style={{ padding: "9px 12px", color: "#1a1208", fontWeight: 400, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {w.name}
                    {w.tags?.includes("new") && <span style={{ fontSize: 9, background: "#e8eef8", color: "#274d8a", padding: "1px 5px", borderRadius: 3, marginLeft: 5 }}>Nova</span>}
                    {w.promo && <span style={{ fontSize: 9, background: "#fef4e0", color: "#8a5a10", padding: "1px 5px", borderRadius: 3, marginLeft: 5 }}>Promo</span>}
                  </td>
                  <td style={{ padding: "9px 12px", color: "#5a4e38", fontSize: 12 }}>{w.type}</td>
                  <td style={{ padding: "9px 12px", color: "#8a7a60", fontSize: 11 }}>{w.origin}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 500, color: "#1a1208" }}>R$ {w.price}</td>
                  <td style={{ padding: "9px 12px", color: w.promo ? "#b85a10" : "#c0b8a8", fontWeight: w.promo ? 500 : 400 }}>
                    {w.promo ? `R$ ${w.promo}` : "—"}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(w)}
                        style={{ background: "none", border: "0.5px solid #d8d0c0", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#8a7a60" }}
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => setConfirmDelete(w)}
                        style={{ background: "none", border: "0.5px solid #d8d0c0", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#8a7a60" }}
                        title="Excluir"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal add/edit */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1208", marginBottom: "1rem" }}>
              {modal.mode === "add" ? "Novo rótulo" : "Editar rótulo"}
            </p>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Nome</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Alamos Malbec" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Tipo</label>
                <select style={selectStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {["Tinto","Branco","Rosé","Espumante","Azeite"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Origem</label>
                <select style={selectStyle} value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}>
                  <option value="ARGENTINA">Argentina</option>
                  <option value="CHILE">Chile</option>
                  <option value="PORTUGAL">Portugal</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Preço (R$)</label>
                <input style={inputStyle} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" min="0" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Promoção (R$)</label>
                <input style={inputStyle} type="number" value={form.promo} onChange={e => setForm(f => ({ ...f, promo: e.target.value }))} placeholder="Deixe vazio" min="0" />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: 11, color: "#8a7a60", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Tags</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["new","promo"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      background: form.tags.includes(tag) ? "#a06420" : "none",
                      border: "0.5px solid " + (form.tags.includes(tag) ? "#a06420" : "#d8d0c0"),
                      color: form.tags.includes(tag) ? "#fff" : "#8a7a60"
                    }}
                  >{tag === "new" ? "Novidade" : "Promoção"}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: "1rem", borderTop: "0.5px solid #ece8e0" }}>
              <button
                onClick={() => setModal(null)}
                style={{ background: "none", border: "0.5px solid #d8d0c0", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "#1a1208" }}
              >Cancelar</button>
              <button
                onClick={save}
                style={{ background: "#a06420", border: "none", color: "#fff", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" }}
              >Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 340 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#1a1208", marginBottom: 8 }}>Confirmar exclusão</p>
            <p style={{ fontSize: 13, color: "#5a4e38", marginBottom: "1.25rem" }}>Remover <strong>{confirmDelete.name}</strong> do catálogo?</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ background: "none", border: "0.5px solid #d8d0c0", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "#1a1208" }}
              >Cancelar</button>
              <button
                onClick={() => { deleteWine(confirmDelete.id); setConfirmDelete(null); }}
                style={{ background: "#c04030", border: "none", color: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
