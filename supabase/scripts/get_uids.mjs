// Uso local (a rede desta sessão remota não alcança supabase.co):
//   npm install @supabase/supabase-js
//   node supabase/scripts/get_uids.mjs
//
// Faz login com os dois usuários de teste e imprime o UUID de cada um.
// A anon key é pública por design (não é segredo).
import { createClient } from "@supabase/supabase-js";

const URL = "https://zgshhsbomqsgqgbzyytn.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnc2hoc2JvbXFzZ3FnYnp5eXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDY5MjQsImV4cCI6MjEwMDQyMjkyNH0.uJUBYpvwl0T1Bosmbwoj0WNecaqOQq0luZq3Eplqmk4";

const users = [
  { label: "matheus", email: "alessandradsm@gmail.com", password: "123456" },
  { label: "fornecedor2", email: "equilibrio.appai@gmail.com", password: "123456" },
];

for (const u of users) {
  const client = createClient(URL, ANON);
  const { data, error } = await client.auth.signInWithPassword(u);
  if (error) {
    console.log(u.label, u.email, "ERROR:", error.message);
  } else {
    console.log(u.label, u.email, "uid:", data.user.id);
  }
}
