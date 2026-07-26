import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase";
import { C, FONT } from "../theme";
import { parseWinesWorkbook, downloadWinesTemplate } from "../lib/importWines";

const EMPTY_FORM = {
  name: "", type: "Tinto", origin: "ARGENTINA", price: "", promo: "", tags: [],
  image_url: "", out_of_stock: false, sommelier_pick: false,
  winery: "", region: "", grape: "", vintage: "", abv: "", food_pairing: "", serving_temp: "", description: "",
};

const label = (text) => (
  <span style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>
    {text}
  </span>
);

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [supplier, setSupplier] = useState(null);
  const [wines, setWines] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { wines, errors }
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { inserted, error }

  const [tab, setTab] = useState("catalogo"); // "catalogo" | "clientes"
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadSupplierAndWines = useCallback(async (userId) => {
    setLoadError("");
    const { data: supplierRow, error: supplierErr } = await supabase
      .from("suppliers")
      .select("*")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (supplierErr || !supplierRow) {
      setLoadError("Este login não está vinculado a nenhum fornecedor cadastrado.");
      return;
    }
    setSupplier(supplierRow);

    const { data: wineRows, error: wineErr } = await supabase
      .from("wines")
      .select("*")
      .eq("supplier_id", supplierRow.id)
      .order("name");

    if (wineErr) {
      setLoadError("Não foi possível carregar o catálogo.");
      return;
    }
    setWines(wineRows || []);

    const { data: favRows, error: favErr } = await supabase
      .from("customer_favorites")
      .select("phone, created_at, wines(name)")
      .eq("supplier_id", supplierRow.id)
      .order("created_at", { ascending: false });

    if (favErr) { setCustomersError("Não foi possível carregar os clientes."); return; }
    const byPhone = new Map();
    (favRows || []).forEach(row => {
      if (!byPhone.has(row.phone)) byPhone.set(row.phone, { phone: row.phone, lastActivity: row.created_at, wineNames: [] });
      byPhone.get(row.phone).wineNames.push(row.wines?.name || "vinho removido");
    });
    setCustomers([...byPhone.values()]);
  }, []);

  useEffect(() => {
    if (session) loadSupplierAndWines(session.user.id);
    else { setSupplier(null); setWines([]); setCustomers([]); }
  }, [session, loadSupplierAndWines]);

  const login = async () => {
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword(loginForm);
    if (error) setLoginError("Login ou senha incorretos.");
  };

  const logout = () => supabase.auth.signOut();

  const filtered = wines.filter(w => {
    const q = search.toLowerCase();
    const matchS = !q || w.name.toLowerCase().includes(q);
    const matchT = typeFilter === "all" || w.type === typeFilter;
    return matchS && matchT;
  });

  const openAdd = () => { setForm(EMPTY_FORM); setSaveError(""); setModal({ mode: "add" }); };
  const openEdit = (w) => {
    setForm({
      name: w.name, type: w.type, origin: w.origin, price: w.price, promo: w.promo ?? "", tags: w.tags || [],
      image_url: w.image_url || "", out_of_stock: w.out_of_stock || false, sommelier_pick: w.sommelier_pick || false,
      winery: w.winery || "", region: w.region || "", grape: w.grape || "", vintage: w.vintage || "",
      abv: w.abv || "", food_pairing: w.food_pairing || "", serving_temp: w.serving_temp || "", description: w.description || "",
    });
    setSaveError("");
    setModal({ mode: "edit", id: w.id });
  };

  const uploadImage = async (file) => {
    setUploadingImage(true);
    setSaveError("");
    const ext = file.name.split(".").pop();
    const path = `${supplier.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("wine-images").upload(path, file);
    if (uploadErr) {
      setUploadingImage(false);
      setSaveError("Não foi possível enviar a imagem: " + uploadErr.message);
      return;
    }
    const { data } = supabase.storage.from("wine-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploadingImage(false);
  };

  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroError, setHeroError] = useState("");
  const uploadHeroImage = async (file) => {
    setUploadingHero(true);
    setHeroError("");
    const ext = file.name.split(".").pop();
    const path = `${supplier.id}/hero-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("wine-images").upload(path, file);
    if (uploadErr) {
      setUploadingHero(false);
      setHeroError("Não foi possível enviar a imagem: " + uploadErr.message);
      return;
    }
    const { data } = supabase.storage.from("wine-images").getPublicUrl(path);
    const { data: updated, error: updateErr } = await supabase
      .from("suppliers")
      .update({ hero_image_url: data.publicUrl })
      .eq("id", supplier.id)
      .select()
      .single();
    setUploadingHero(false);
    if (updateErr) { setHeroError("Não foi possível salvar: " + updateErr.message); return; }
    setSupplier(updated);
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    setLogoError("");
    const ext = file.name.split(".").pop();
    const path = `${supplier.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("wine-images").upload(path, file);
    if (uploadErr) {
      setUploadingLogo(false);
      setLogoError("Não foi possível enviar a imagem: " + uploadErr.message);
      return;
    }
    const { data } = supabase.storage.from("wine-images").getPublicUrl(path);
    const { data: updated, error: updateErr } = await supabase
      .from("suppliers")
      .update({ logo_url: data.publicUrl })
      .eq("id", supplier.id)
      .select()
      .single();
    setUploadingLogo(false);
    if (updateErr) { setLogoError("Não foi possível salvar: " + updateErr.message); return; }
    setSupplier(updated);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaveError("");
    const payload = {
      name: form.name.trim(), type: form.type, origin: form.origin,
      price: parseFloat(form.price),
      promo: form.promo ? parseFloat(form.promo) : null,
      tags: form.tags,
      image_url: form.image_url || null,
      out_of_stock: form.out_of_stock,
      sommelier_pick: form.sommelier_pick,
      winery: form.winery || null,
      region: form.region || null,
      grape: form.grape || null,
      vintage: form.vintage || null,
      abv: form.abv || null,
      food_pairing: form.food_pairing || null,
      serving_temp: form.serving_temp || null,
      description: form.description || null,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("wines")
        .insert({ ...payload, supplier_id: supplier.id })
        .select()
        .single();
      if (error) { setSaveError("Não foi possível salvar: " + error.message); return; }
      setWines(w => [...w, data].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const { data, error } = await supabase
        .from("wines")
        .update(payload)
        .eq("id", modal.id)
        .select()
        .single();
      if (error) { setSaveError("Não foi possível salvar: " + error.message); return; }
      setWines(w => w.map(x => x.id === modal.id ? data : x));
    }
    setModal(null);
  };

  const toggleTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));
  };

  const toggleStock = async (wine) => {
    const { data, error } = await supabase
      .from("wines")
      .update({ out_of_stock: !wine.out_of_stock })
      .eq("id", wine.id)
      .select()
      .single();
    if (!error) setWines(w => w.map(x => x.id === wine.id ? data : x));
  };

  const doDelete = async (wine) => {
    const { error } = await supabase.from("wines").delete().eq("id", wine.id);
    if (!error) setWines(w => w.filter(x => x.id !== wine.id));
    setConfirmDelete(null);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportResult(null);
    const buffer = await file.arrayBuffer();
    const { wines: parsedWines, errors } = await parseWinesWorkbook(buffer);
    setImportPreview({ wines: parsedWines, errors });
  };

  const confirmImport = async () => {
    if (!importPreview || importPreview.wines.length === 0) return;
    setImporting(true);
    const payload = importPreview.wines.map(w => ({ ...w, supplier_id: supplier.id }));
    const { data, error } = await supabase.from("wines").insert(payload).select();
    setImporting(false);
    if (error) {
      setImportResult({ inserted: 0, error: error.message });
      return;
    }
    setWines(w => [...w, ...data].sort((a, b) => a.name.localeCompare(b.name)));
    setImportResult({ inserted: data.length, error: null });
    setImportPreview(null);
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

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "1rem" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "2rem 1.75rem", width: "100%", maxWidth: 360 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 8, fontWeight: 700 }}>
            Adega Selecionada
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Área restrita</p>
          <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: "1.75rem" }}>Acesso exclusivo para o fornecedor</p>

          {label("E-mail")}
          <input
            type="email"
            value={loginForm.email}
            onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
            placeholder="voce@exemplo.com"
            style={{ ...fieldInput, marginBottom: 10 }}
          />
          {label("Senha")}
          <input
            type="password"
            value={loginForm.password}
            onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="••••••••"
            style={{ ...fieldInput, border: `1px solid ${loginError ? C.danger : C.line}`, marginBottom: 6 }}
          />
          {loginError && <p style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{loginError}</p>}
          <button
            onClick={login}
            style={{ width: "100%", background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", marginTop: 6 }}
          >Entrar</button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "1rem" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "2rem 1.75rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Não foi possível abrir o painel</p>
          <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: "1.5rem" }}>{loadError}</p>
          <button onClick={logout} style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 7, padding: "9px 16px", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Sair</button>
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
            {supplier?.business_name}
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Painel do fornecedor</p>
        </div>
        <button
          onClick={logout}
          style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 7, padding: "6px 13px", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}
        >Sair</button>
      </div>

      {/* Abas */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: "0 1.25rem", display: "flex", gap: 4, maxWidth: 900, margin: "0 auto" }}>
        {[["catalogo", "Catálogo"], ["clientes", `Clientes (${customers.length})`]].map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab === key ? C.ink : "transparent"}`,
              color: tab === key ? C.ink : C.muted, fontWeight: tab === key ? 700 : 400,
              padding: "10px 4px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", marginRight: 20,
            }}
          >{lbl}</button>
        ))}
      </div>

      {tab === "clientes" ? (
        <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto" }}>
          {customersError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{customersError}</p>}
          {customers.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13.5, padding: "2rem", textAlign: "center" }}>
              Nenhum cliente favoritou vinhos ainda.
            </p>
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              {customers.map((c, i) => (
                <div key={c.phone} style={{ padding: "12px 16px", borderBottom: i < customers.length - 1 ? `1px solid ${C.line}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: C.ink, textDecoration: "none" }}>
                      {c.phone}
                    </a>
                    <span style={{ fontSize: 11, color: C.muted }}>{new Date(c.lastActivity).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.inkSoft }}>♥ {c.wineNames.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto" }}>
        {/* Foto de capa */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "1rem", marginBottom: "1.25rem", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {supplier?.hero_image_url ? (
            <img src={supplier.hero_image_url} alt="" style={{ width: 90, height: 60, objectFit: "cover", borderRadius: 6 }} />
          ) : (
            <div style={{ width: 90, height: 60, borderRadius: 6, background: C.bg, border: `1px dashed ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.muted, textAlign: "center" }}>
              Sem foto
            </div>
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Foto de capa da carta</p>
            <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 8 }}>Aparece no topo do catálogo público. Prefira fotos horizontais, bem iluminadas.</p>
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadHeroImage(e.target.files[0])} disabled={uploadingHero} style={{ fontSize: 12, color: C.inkSoft }} />
            {uploadingHero && <p style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>Enviando...</p>}
            {heroError && <p style={{ fontSize: 11.5, color: C.danger, marginTop: 4 }}>{heroError}</p>}
          </div>
        </div>

        {/* Logo */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "1rem", marginBottom: "1.25rem", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {supplier?.logo_url ? (
            <img src={supplier.logo_url} alt="" style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 6, background: C.bg }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 6, background: C.bg, border: `1px dashed ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.muted, textAlign: "center" }}>
              Sem logo
            </div>
          )}
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 2 }}>Logo (opcional)</p>
            <p style={{ fontSize: 11.5, color: C.muted, marginBottom: 8 }}>Aparece no topo do catálogo, no lugar do nome em texto. Se não enviar, continua mostrando o nome normalmente.</p>
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} disabled={uploadingLogo} style={{ fontSize: 12, color: C.inkSoft }} />
            {uploadingLogo && <p style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>Enviando...</p>}
            {logoError && <p style={{ fontSize: 11.5, color: C.danger, marginTop: 4 }}>{logoError}</p>}
          </div>
        </div>

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
            {[...new Set(wines.map(w => w.type))].filter(Boolean).sort().map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={openAdd}
            style={{ background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
          >+ Novo rótulo</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
          >Importar planilha</button>
          <button
            onClick={downloadWinesTemplate}
            style={{ background: "none", border: "none", color: C.inkSoft, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline" }}
          >Baixar modelo</button>
        </div>

        {/* Lista de rótulos (mobile-first: não usa table) */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
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
                gridTemplateColumns: "1fr 90px 90px 80px 80px 92px",
                gap: 0,
                padding: "10px 14px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.line}` : "none",
                alignItems: "center",
                opacity: w.out_of_stock ? 0.55 : 1,
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {w.name}
                </p>
                <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
                  {w.out_of_stock && (
                    <span style={{ fontSize: 9.5, color: C.danger, fontWeight: 700, textTransform: "uppercase" }}>Esgotado</span>
                  )}
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
                  onClick={() => toggleStock(w)}
                  style={{ background: "none", border: `1px solid ${w.out_of_stock ? C.danger : C.line}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 12, color: w.out_of_stock ? C.danger : C.inkSoft }}
                  title={w.out_of_stock ? "Marcar disponível" : "Marcar esgotado"}
                >🚫</button>
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
      )}

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
                <input
                  style={fieldInput} list="type-options" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  placeholder="Ex: Tinto, Cerveja, Whisky..."
                />
                <datalist id="type-options">
                  {[...new Set(["Tinto", "Branco", "Rosé", "Espumante", "Azeite", ...wines.map(w => w.type)])].filter(Boolean).map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                {label("Origem")}
                <input
                  style={fieldInput} list="origin-options" value={form.origin}
                  onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))}
                  placeholder="Ex: Argentina, França..."
                />
                <datalist id="origin-options">
                  {[...new Set(["ARGENTINA", "CHILE", "PORTUGAL", "BRASIL", ...wines.map(w => w.origin)])].filter(Boolean).map(o => <option key={o} value={o} />)}
                </datalist>
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

            <div style={{ marginBottom: 12 }}>
              {label("Foto da garrafa")}
              {form.image_url && (
                <img src={form.image_url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 8, display: "block" }} />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}
                disabled={uploadingImage}
                style={{ fontSize: 12.5, color: C.inkSoft }}
              />
              {uploadingImage && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Enviando...</p>}
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.out_of_stock}
                  onChange={e => setForm(f => ({ ...f, out_of_stock: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13.5, color: C.ink }}>Esgotado</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.sommelier_pick}
                  onChange={e => setForm(f => ({ ...f, sommelier_pick: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13.5, color: C.ink }}>Escolha do sommelier</span>
              </label>
            </div>

            <details style={{ marginBottom: "1.25rem", border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px" }}>
              <summary style={{ fontSize: 12.5, color: C.inkSoft, cursor: "pointer", fontWeight: 600 }}>
                Ficha técnica (opcional)
              </summary>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>{label("Vinícola")}<input style={fieldInput} value={form.winery} onChange={e => setForm(f => ({ ...f, winery: e.target.value }))} /></div>
                  <div>{label("Região")}<input style={fieldInput} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} /></div>
                  <div>{label("Uva")}<input style={fieldInput} value={form.grape} onChange={e => setForm(f => ({ ...f, grape: e.target.value }))} placeholder="Ex: Malbec" /></div>
                  <div>{label("Safra")}<input style={fieldInput} value={form.vintage} onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))} placeholder="Ex: 2021" /></div>
                  <div>{label("Teor alcoólico")}<input style={fieldInput} value={form.abv} onChange={e => setForm(f => ({ ...f, abv: e.target.value }))} placeholder="Ex: 13,5%" /></div>
                  <div>{label("Temperatura de serviço")}<input style={fieldInput} value={form.serving_temp} onChange={e => setForm(f => ({ ...f, serving_temp: e.target.value }))} placeholder="Ex: 16-18°C" /></div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  {label("Harmonização")}
                  <input style={fieldInput} value={form.food_pairing} onChange={e => setForm(f => ({ ...f, food_pairing: e.target.value }))} placeholder="Ex: Carnes vermelhas, queijos maturados" />
                </div>
                <div>
                  {label("Descrição")}
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ ...fieldInput, resize: "vertical" }}
                  />
                </div>
              </div>
            </details>

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

            {saveError && <p style={{ fontSize: 12, color: C.danger, marginBottom: 10 }}>{saveError}</p>}

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
                onClick={() => doDelete(confirmDelete)}
                style={{ flex: 1, background: C.danger, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview de importação */}
      {importPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(34,31,26,0.45)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: C.surface, borderRadius: "14px 14px 0 0", padding: "1.5rem 1.25rem 2rem", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Importar planilha</p>
            <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 12 }}>
              {importPreview.wines.length} {importPreview.wines.length === 1 ? "vinho pronto" : "vinhos prontos"} pra importar
              {importPreview.errors.length > 0 && `, ${importPreview.errors.length} linha(s) com problema (serão ignoradas)`}.
            </p>

            {importPreview.errors.length > 0 && (
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "0.75rem 1rem", marginBottom: 12, maxHeight: 140, overflowY: "auto" }}>
                {importPreview.errors.map((err, i) => (
                  <p key={i} style={{ fontSize: 12, color: C.danger, marginBottom: 4 }}>{err}</p>
                ))}
              </div>
            )}

            {importPreview.wines.length > 0 && (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", marginBottom: "1.25rem" }}>
                {importPreview.wines.slice(0, 8).map((w, i) => (
                  <div key={i} style={{ padding: "8px 12px", borderBottom: i < Math.min(importPreview.wines.length, 8) - 1 ? `1px solid ${C.line}` : "none", fontSize: 13, color: C.ink, display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
                    <span style={{ color: C.inkSoft, flexShrink: 0 }}>R$ {w.price}</span>
                  </div>
                ))}
                {importPreview.wines.length > 8 && (
                  <p style={{ padding: "8px 12px", fontSize: 12, color: C.muted }}>+ {importPreview.wines.length - 8} outros...</p>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, paddingTop: "1rem", borderTop: `1px solid ${C.line}` }}>
              <button
                onClick={() => setImportPreview(null)}
                style={{ flex: 1, background: "none", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", color: C.inkSoft }}
              >Cancelar</button>
              <button
                onClick={confirmImport}
                disabled={importPreview.wines.length === 0 || importing}
                style={{ flex: 2, background: importPreview.wines.length === 0 ? C.line : C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: importPreview.wines.length === 0 ? "not-allowed" : "pointer" }}
              >{importing ? "Importando..." : `Importar ${importPreview.wines.length} vinhos`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado da importação */}
      {importResult && (
        <div style={{ position: "fixed", bottom: 20, left: 20, right: 20, maxWidth: 400, margin: "0 auto", zIndex: 200, background: importResult.error ? C.danger : C.success, color: C.surface, borderRadius: 8, padding: "12px 16px", fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span>{importResult.error ? `Erro ao importar: ${importResult.error}` : `${importResult.inserted} vinhos importados com sucesso.`}</span>
          <button onClick={() => setImportResult(null)} style={{ background: "none", border: "none", color: C.surface, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>
      )}
    </div>
  );
}
