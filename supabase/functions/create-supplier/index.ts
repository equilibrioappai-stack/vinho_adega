// Edge Function: cria o login (Supabase Auth) e a linha em `suppliers` de um
// novo fornecedor, num passo só. Só quem chama autenticado como o dono
// (equilibrio.appai@gmail.com) consegue usar isso — a checagem é feita aqui
// no servidor, não confia em nada vindo do navegador.
//
// Como fazer o deploy: Supabase Dashboard → Edge Functions → New Function →
// nome "create-supplier" → cole este arquivo → Deploy. Não precisa
// configurar nenhum secret: SUPABASE_SERVICE_ROLE_KEY e SUPABASE_URL já
// ficam disponíveis automaticamente pra toda Edge Function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OWNER_EMAIL = "equilibrio.appai@gmail.com";

// Chamado do navegador (outra origem) — sem isso o navegador bloqueia a
// requisição antes dela sequer chegar aqui (preflight CORS).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !user || user.email !== OWNER_EMAIL) {
    return json({ error: "Não autorizado." }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const {
    business_name, slug, admin_email, admin_password,
    whatsapp_number, cart_greeting, theme_color,
    contact_email, start_date, billing_day,
  } = body;

  if (!business_name || !slug || !admin_email || !admin_password || !whatsapp_number) {
    return json({ error: "Campos obrigatórios faltando." }, 400);
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: admin_email,
    password: admin_password,
    email_confirm: true,
  });
  if (createErr) {
    return json({ error: `Não foi possível criar o login: ${createErr.message}` }, 400);
  }

  const { data: supplierRow, error: insertErr } = await adminClient
    .from("suppliers")
    .insert({
      auth_user_id: created.user.id,
      business_name,
      slug,
      whatsapp_number,
      cart_greeting: cart_greeting || "Olá! Gostaria de fazer um pedido:",
      theme_color: theme_color || null,
      contact_email: contact_email || null,
      start_date: start_date || null,
      billing_day: billing_day || null,
    })
    .select()
    .single();

  if (insertErr) {
    // reverte o usuário criado pra não deixar login órfão sem fornecedor
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: `Não foi possível cadastrar o fornecedor: ${insertErr.message}` }, 400);
  }

  return json({ supplier: supplierRow });
});
