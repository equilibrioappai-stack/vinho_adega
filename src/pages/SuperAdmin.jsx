import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { C, FONT } from "../theme";

const OWNER_EMAIL = "equilibrio.appai@gmail.com";

const EMPTY_FORM = {
  business_name: "", slug: "", admin_email: "", admin_password: "",
  whatsapp_number: "", cart_greeting: "Olá! Gostaria de fazer um pedido:",
  theme_color: "", contact_email: "", start_date: "", billing_day: "",
};

const label = (text) => (
  <span style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 4 }}>
    {text}
  </span>
);

const fieldInput = {
  width: "100%", background: C.bg, border: `1px solid ${C.line}`,
  borderRadius: 7, padding: "9px 11px", fontSize: 13.5, fontFamily: "inherit",
  color: C.ink, outline: "none", boxSizing: "border-box",
};

function daysUntilNextBilling(day) {
  if (!day) return null;
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
  const target = thisMonth >= new Date(today.getFullYear(), today.getMonth(), today.getDate())
    ? thisMonth
    : new Date(today.getFullYear(), today.getMonth() + 1, day);
  return Math.round((target - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

export default function SuperAdmin() {
  const [session, setSession] = useState(undefined);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadSuppliers = useCallback(async () => {
    setLoadError("");
    const { data, error } = await supabase.from("suppliers").select("*").order("business_name");
    if (error) { setLoadError(error.message); return; }
    setSuppliers(data || []);
  }, []);

  useEffect(() => {
    if (session?.user?.email === OWNER_EMAIL) loadSuppliers();
  }, [session, loadSuppliers]);

  const login = async () => {
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword(loginForm);
    if (error) setLoginError("Login ou senha incorretos.");
  };
  const logout = () => supabase.auth.signOut();

  const createSupplier = async () => {
    setSaveError("");
    if (!form.business_name || !form.slug || !form.admin_email || !form.admin_password || !form.whatsapp_number) {
      setSaveError("Preencha nome, slug, e-mail, senha e WhatsApp.");
      return;
    }
    setSaving(true);
    const { data: { session: current } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-supplier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${current.access_token}`,
      },
      body: JSON.stringify({
        ...form,
        billing_day: form.billing_day ? parseInt(form.billing_day, 10) : null,
      }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) { setSaveError(body.error || "Erro ao cadastrar."); return; }
    setSuppliers(s => [...s, body.supplier].sort((a, b) => a.business_name.localeCompare(b.business_name)));
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  if (!session || session.user.email !== OWNER_EMAIL) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "1rem" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: "2rem 1.75rem", width: "100%", maxWidth: 360 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Painel do dono</p>
          <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: "1.75rem" }}>Acesso restrito</p>
          {label("E-mail")}
          <input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} style={{ ...fieldInput, marginBottom: 10 }} />
          {label("Senha")}
          <input type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && login()} style={{ ...fieldInput, marginBottom: 6 }} />
          {loginError && <p style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={login} style={{ width: "100%", background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "11px", fontSize: 14, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", marginTop: 6 }}>Entrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.line}`, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Painel do dono — Fornecedores</p>
        <button onClick={logout} style={{ background: "none", border: `1px solid ${C.line}`, color: C.inkSoft, borderRadius: 7, padding: "6px 13px", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>Sair</button>
      </div>

      <div style={{ padding: "1.25rem", maxWidth: 900, margin: "0 auto" }}>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "9px 15px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", marginBottom: "1.25rem" }}
        >{showForm ? "Cancelar" : "+ Novo fornecedor"}</button>

        {showForm && (
          <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>{label("Nome do negócio")}<input style={fieldInput} value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Ex: Vinhos do João" /></div>
              <div>{label("Slug da URL")}<input style={fieldInput} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="joao-vinhos" /></div>
              <div>{label("E-mail de login (Admin)")}<input style={fieldInput} type="email" value={form.admin_email} onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))} /></div>
              <div>{label("Senha inicial")}<input style={fieldInput} value={form.admin_password} onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))} /></div>
              <div>{label("WhatsApp (só números, com DDI)")}<input style={fieldInput} value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="5511999998888" /></div>
              <div>{label("Cor do tema (opcional)")}<input style={fieldInput} value={form.theme_color} onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))} placeholder="#6E2A2A" /></div>
              <div>{label("E-mail de contato")}<input style={fieldInput} type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div>{label("Data de início")}<input style={fieldInput} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div>{label("Dia de cobrança (1-31)")}<input style={fieldInput} type="number" min="1" max="31" value={form.billing_day} onChange={e => setForm(f => ({ ...f, billing_day: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              {label("Saudação do carrinho")}
              <input style={fieldInput} value={form.cart_greeting} onChange={e => setForm(f => ({ ...f, cart_greeting: e.target.value }))} />
            </div>
            {saveError && <p style={{ fontSize: 12, color: C.danger, marginBottom: 10 }}>{saveError}</p>}
            <button onClick={createSupplier} disabled={saving} style={{ background: C.ink, border: "none", color: C.surface, borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontFamily: "inherit", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Cadastrando..." : "Cadastrar fornecedor"}
            </button>
          </div>
        )}

        {loadError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{loadError}</p>}

        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
          {suppliers.length === 0 && (
            <p style={{ padding: "2rem", textAlign: "center", color: C.muted, fontSize: 13.5 }}>Nenhum fornecedor cadastrado ainda.</p>
          )}
          {suppliers.map((s, i) => {
            const days = daysUntilNextBilling(s.billing_day);
            return (
              <div key={s.id} style={{ padding: "12px 16px", borderBottom: i < suppliers.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{s.business_name}</p>
                  <a href={`/catalogo/${s.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.accent }}>/catalogo/{s.slug}</a>
                </div>
                <p style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
                  {s.contact_email || "sem e-mail de contato"} · WhatsApp {s.whatsapp_number}
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  {s.start_date && <span style={{ fontSize: 11.5, color: C.muted }}>Início: {s.start_date}</span>}
                  {days !== null && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: days === 0 ? C.danger : days <= 3 ? C.gold : C.muted }}>
                      {days === 0 ? "Cobrança vence hoje" : `Cobrança em ${days} dia${days === 1 ? "" : "s"}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
