import { useState } from "react";
import { useWines } from "../components/WineContext";

const WHATSAPP_NUMBER = "5541996483811"; // formato internacional, sem espaços ou símbolos

const inputStyle = {
  width: "100%",
  background: "#1e1810",
  border: "0.5px solid #3a2e1e",
  color: "#e8e0d0",
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  marginBottom: 10,
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 10.5,
  color: "#7a6848",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 4,
  display: "block",
};

function buildMessage(cartItems, total, form) {
  const lines = [];
  lines.push("Olá! Gostaria de fazer um pedido:");
  lines.push("");
  cartItems.forEach(item => {
    lines.push(`🍷 ${item.wine.name} x${item.qty} — R$ ${item.lineTotal.toLocaleString("pt-BR")}`);
  });
  lines.push("");
  lines.push(`Subtotal: R$ ${total.toLocaleString("pt-BR")}`);
  lines.push("");
  lines.push("Dados para entrega:");
  lines.push(`Nome: ${form.nome}`);
  lines.push(`Telefone: ${form.telefone}`);
  lines.push(`Cidade: ${form.cidade}`);
  lines.push(`Bairro: ${form.bairro}`);
  lines.push(`Endereço: ${form.endereco}`);
  lines.push(`CEP: ${form.cep}`);
  return lines.join("\n");
}

export default function Cart() {
  const { cartItems, cartCount, cartTotal, addToCart, decreaseFromCart, removeFromCart, clearCart } = useWines();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("review"); // "review" | "checkout"
  const [form, setForm] = useState({ nome: "", telefone: "", cidade: "", bairro: "", endereco: "", cep: "" });
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleClose = () => {
    setOpen(false);
    setStep("review");
    setError("");
  };

  const handleConfirm = () => {
    if (!form.nome || !form.telefone || !form.endereco) {
      setError("Preencha pelo menos nome, telefone e endereço.");
      return;
    }
    const message = buildMessage(cartItems, cartTotal, form);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    clearCart();
    setForm({ nome: "", telefone: "", cidade: "", bairro: "", endereco: "", cep: "" });
    handleClose();
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 40,
          background: "#a06420", color: "#0f0c08", border: "none",
          borderRadius: 28, padding: "12px 18px", fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)", fontFamily: "inherit",
        }}
      >
        🛒 Carrinho
        {cartCount > 0 && (
          <span style={{
            background: "#0f0c08", color: "#e8c878", borderRadius: 999,
            fontSize: 11, fontWeight: 700, padding: "2px 7px", minWidth: 18, textAlign: "center",
          }}>{cartCount}</span>
        )}
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(8,6,3,0.7)",
            display: "flex", justifyContent: "flex-end", zIndex: 50,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)", height: "100%", background: "#15110a",
              borderLeft: "0.5px solid #3a2e1e", display: "flex", flexDirection: "column",
              color: "#e8e0d0", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "0.5px solid #2e2418", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, margin: 0 }}>
                {step === "review" ? "Seu pedido" : "Dados de entrega"}
              </h2>
              <button onClick={handleClose} style={{ background: "none", border: "none", color: "#7a6848", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {step === "review" ? (
                cartItems.length === 0 ? (
                  <p style={{ color: "#5a4e38", fontSize: 13, padding: "2rem 0", textAlign: "center" }}>
                    Seu carrinho está vazio.
                  </p>
                ) : (
                  cartItems.map(item => (
                    <div key={item.wine.id} style={{ display: "flex", gap: 10, padding: "0.75rem 0", borderBottom: "0.5px solid #1e1810" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.wine.name}</p>
                        <p style={{ fontSize: 12, color: "#a06420" }}>R$ {item.lineTotal.toLocaleString("pt-BR")}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => decreaseFromCart(item.wine.id)} style={stepperBtn}>–</button>
                        <span style={{ fontSize: 13, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => addToCart(item.wine.id)} style={stepperBtn}>+</button>
                        <button onClick={() => removeFromCart(item.wine.id)} style={{ ...stepperBtn, color: "#a04848", marginLeft: 4 }}>✕</button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <>
                  <label style={labelStyle}>Nome</label>
                  <input style={inputStyle} value={form.nome} onChange={handleChange("nome")} />
                  <label style={labelStyle}>Telefone</label>
                  <input style={inputStyle} value={form.telefone} onChange={handleChange("telefone")} placeholder="(41) 99999-9999" />
                  <label style={labelStyle}>Cidade</label>
                  <input style={inputStyle} value={form.cidade} onChange={handleChange("cidade")} />
                  <label style={labelStyle}>Bairro</label>
                  <input style={inputStyle} value={form.bairro} onChange={handleChange("bairro")} />
                  <label style={labelStyle}>Endereço</label>
                  <input style={inputStyle} value={form.endereco} onChange={handleChange("endereco")} placeholder="Rua, número, complemento" />
                  <label style={labelStyle}>CEP</label>
                  <input style={inputStyle} value={form.cep} onChange={handleChange("cep")} />
                  {error && <p style={{ color: "#c87878", fontSize: 12, marginTop: 4 }}>{error}</p>}
                </>
              )}
            </div>

            <div style={{ padding: "1rem 1.5rem", borderTop: "0.5px solid #2e2418" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#7a6848" }}>Subtotal</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#e8d8b8" }}>
                  R$ {cartTotal.toLocaleString("pt-BR")}
                </span>
              </div>
              {step === "review" ? (
                <button
                  onClick={() => setStep("checkout")}
                  disabled={cartItems.length === 0}
                  style={{
                    width: "100%", background: cartItems.length === 0 ? "#3a2e1e" : "#a06420",
                    color: cartItems.length === 0 ? "#5a4e38" : "#0f0c08",
                    border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600,
                    cursor: cartItems.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  Finalizar pedido
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setStep("review")} style={{ flex: 1, background: "transparent", border: "0.5px solid #3a2e1e", color: "#7a6848", borderRadius: 8, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Voltar
                  </button>
                  <button onClick={handleConfirm} style={{ flex: 2, background: "#2e8c4a", color: "#0f0c08", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Enviar pelo WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const stepperBtn = {
  background: "#231c12", border: "0.5px solid #3a2e1e", color: "#e8e0d0",
  borderRadius: 6, width: 24, height: 24, fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
