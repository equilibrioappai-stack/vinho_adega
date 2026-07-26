const HEADER_ALIASES = {
  name: ["name", "nome", "rotulo", "rótulo", "vinho"],
  type: ["type", "tipo"],
  origin: ["origin", "origem", "pais", "país"],
  price: ["price", "preco", "preço"],
  promo: ["promo", "promocao", "promoção"],
  tags: ["tags", "etiquetas"],
  out_of_stock: ["esgotado", "out_of_stock", "sem estoque", "indisponivel", "indisponível"],
};

function parseBoolean(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return ["sim", "s", "true", "1", "esgotado", "x", "yes"].includes(v);
}

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase();
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

// Lê um arquivo .csv ou .xlsx (ArrayBuffer) e devolve { wines, errors }.
// wines já vem no formato pronto pra inserir na tabela wines (sem supplier_id).
// Import da lib xlsx é sob demanda: ela é pesada e só o Admin usa import de planilha,
// não faz sentido o catálogo público (acessado via QR code no celular) baixar isso.
export async function parseWinesWorkbook(arrayBuffer) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    return { wines: [], errors: ["Arquivo vazio ou sem linhas de dados."] };
  }

  const headers = Object.keys(rows[0]);
  const headerMap = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    headerMap[field] = headers.find(h => aliases.includes(normalizeHeader(h)));
  }

  if (!headerMap.name || !headerMap.price) {
    return {
      wines: [],
      errors: [`Planilha precisa ter pelo menos as colunas "nome" e "preço". Colunas encontradas: ${headers.join(", ")}`],
    };
  }

  const wines = [];
  const errors = [];

  rows.forEach((raw, i) => {
    const name = String(raw[headerMap.name] ?? "").trim();
    const price = parseNumber(raw[headerMap.price]);

    if (!name || price === null) {
      errors.push(`Linha ${i + 2}: nome ou preço inválido — ignorada.`);
      return;
    }

    const tagsRaw = headerMap.tags ? String(raw[headerMap.tags] ?? "").trim() : "";
    const tags = tagsRaw ? tagsRaw.split(/[;,]/).map(t => t.trim()).filter(Boolean) : [];

    wines.push({
      name,
      type: headerMap.type ? String(raw[headerMap.type] ?? "").trim() || "Tinto" : "Tinto",
      origin: headerMap.origin ? String(raw[headerMap.origin] ?? "").trim().toUpperCase() : "",
      price,
      promo: headerMap.promo ? parseNumber(raw[headerMap.promo]) : null,
      tags,
      out_of_stock: headerMap.out_of_stock ? parseBoolean(raw[headerMap.out_of_stock]) : false,
    });
  });

  return { wines, errors };
}

// Modelo de planilha CSV pronto pra baixar, com as colunas esperadas e
// duas linhas de exemplo — não depende da lib xlsx, é só texto.
export function downloadWinesTemplate() {
  const header = "nome,tipo,origem,preco,promo,tags,esgotado";
  const example1 = "Alamos Malbec,Tinto,ARGENTINA,70,59,promo,";
  const example2 = "Chandon Extra Brut,Espumante,ARGENTINA,100,,,";
  const csv = [header, example1, example2].join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-catalogo.csv";
  a.click();
  URL.revokeObjectURL(url);
}
