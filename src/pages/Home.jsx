import { C, FONT } from "../theme";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: "1rem" }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 8, fontWeight: 700 }}>
          Adega Black Box
        </p>
        <p style={{ fontSize: 15, color: C.inkSoft }}>
          Use o link do catálogo enviado pelo seu fornecedor para acessar a lista de vinhos.
        </p>
      </div>
    </div>
  );
}
