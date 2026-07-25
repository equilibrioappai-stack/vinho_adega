// Uso local:
//   npm install @supabase/supabase-js
//   node supabase/scripts/test_rls.mjs
//
// Testa isolamento multi-tenant chamando a API diretamente com a anon key
// (sem passar pela UI), como pedido no critério de aceite da Fase 1.
import { createClient } from "@supabase/supabase-js";

const URL = "https://zgshhsbomqsgqgbzyytn.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnc2hoc2JvbXFzZ3FnYnp5eXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDY5MjQsImV4cCI6MjEwMDQyMjkyNH0.uJUBYpvwl0T1Bosmbwoj0WNecaqOQq0luZq3Eplqmk4";

const A = { email: "alessandradsm@gmail.com", password: "123456", slug: "fornecedor-teste-a" };
const B = { email: "equilibrio.appai@gmail.com", password: "123456", slug: "fornecedor-teste-b" };

let pass = 0, fail = 0;
function check(label, ok, detail) {
  console.log(`${ok ? "OK  " : "FAIL"} - ${label}${detail ? " :: " + detail : ""}`);
  ok ? pass++ : fail++;
}

async function signIn(creds) {
  const client = createClient(URL, ANON);
  const { data, error } = await client.auth.signInWithPassword(creds);
  if (error) throw new Error(`login falhou (${creds.email}): ${error.message}`);
  return client;
}

async function getSupplierId(client, slug) {
  const { data, error } = await client.from("suppliers_public").select("id").eq("slug", slug).single();
  if (error) throw new Error(`suppliers_public falhou: ${error.message}`);
  return data.id;
}

const clientA = await signIn(A);
const clientB = await signIn(B);
const idA = await getSupplierId(clientA, A.slug);
const idB = await getSupplierId(clientB, B.slug);
console.log("supplier A id:", idA, " supplier B id:", idB);

// 1. Leitura pública: B consegue ler o catálogo de A (esperado: catálogo é vitrine pública)
{
  const { data, error } = await clientB.from("wines").select("id").eq("supplier_id", idA).limit(1);
  check("B consegue LER catálogo de A (leitura pública é esperada)", !error && data.length > 0, error?.message);
}

// 2. B tenta INSERIR um vinho no catálogo de A -> deve falhar
{
  const { data, error } = await clientB.from("wines").insert({
    supplier_id: idA, name: "Invasão Teste", type: "Tinto", origin: "ARGENTINA", price: 1,
  }).select();
  check("B NÃO consegue INSERIR em catálogo de A", !!error || (data && data.length === 0), error?.message);
}

// 3. A insere um vinho próprio de verdade
let wineIdA;
{
  const { data, error } = await clientA.from("wines").insert({
    supplier_id: idA, name: "Vinho de Teste A", type: "Tinto", origin: "ARGENTINA", price: 50,
  }).select().single();
  check("A consegue INSERIR no próprio catálogo", !error && !!data, error?.message);
  wineIdA = data?.id;
}

// 4. B tenta ATUALIZAR o vinho que pertence a A -> deve falhar (0 linhas afetadas)
if (wineIdA) {
  const { data, error } = await clientB.from("wines").update({ price: 999 }).eq("id", wineIdA).select();
  check("B NÃO consegue ATUALIZAR vinho de A", !error && data.length === 0, error?.message);
}

// 5. B tenta DELETAR o vinho que pertence a A -> deve falhar (0 linhas afetadas)
if (wineIdA) {
  const { data, error } = await clientB.from("wines").delete().eq("id", wineIdA).select();
  check("B NÃO consegue DELETAR vinho de A", !error && data.length === 0, error?.message);
}

// 6. A ainda consegue editar o próprio vinho
if (wineIdA) {
  const { data, error } = await clientA.from("wines").update({ price: 55 }).eq("id", wineIdA).select();
  check("A consegue ATUALIZAR o próprio vinho", !error && data.length === 1 && data[0].price === 55, error?.message);
}

// 7. limpeza
if (wineIdA) {
  await clientA.from("wines").delete().eq("id", wineIdA);
}

console.log(`\n${pass} ok / ${fail} falhas`);
process.exit(fail > 0 ? 1 : 0);
