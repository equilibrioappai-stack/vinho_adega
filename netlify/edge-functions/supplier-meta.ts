// Roda antes da página carregar, pra quem abre um link de /catalogo/:slug
// (WhatsApp, redes sociais, etc.) já ver o nome e a logo certos na prévia
// do link, e pra aba do navegador já abrir com o favicon do fornecedor —
// nada disso é possível só com JavaScript no cliente, porque quem gera
// essa prévia (WhatsApp) não executa JS, só lê o HTML como veio do servidor.

const SUPABASE_URL = "https://zgshhsbomqsgqgbzyytn.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnc2hoc2JvbXFzZ3FnYnp5eXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDY5MjQsImV4cCI6MjEwMDQyMjkyNH0.uJUBYpvwl0T1Bosmbwoj0WNecaqOQq0luZq3Eplqmk4";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async (request: Request, context: any) => {
  const response = await context.next();
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/catalogo\/([^/]+)/);
  if (!match) return response;

  let supplier;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/suppliers_public?slug=eq.${encodeURIComponent(match[1])}&select=business_name,logo_url,hero_image_url`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    );
    const rows = await res.json();
    supplier = rows[0];
  } catch {
    return response;
  }

  if (!supplier) return response;

  let html = await response.text();
  const title = `${supplier.business_name} | Carta de Vinhos`;
  const description = `Carta de vinhos digital de ${supplier.business_name}.`;
  const image = supplier.logo_url || supplier.hero_image_url;

  html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${url.toString()}" />`);
  if (image) {
    html = html.replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${image}" />`);
    html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${image}" />`);
  }

  return new Response(html, { headers: response.headers });
};

export const config = { path: "/catalogo/*" };
