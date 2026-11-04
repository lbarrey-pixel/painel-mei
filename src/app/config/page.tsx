import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ConfigForm from "./ConfigForm";
import AllowlistManager from "./AllowlistManager";
import type { ConfigGeral } from "@/lib/types";

export default async function ConfigPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: config } = await supabase
    .from("config_geral")
    .select("*")
    .eq("id", true)
    .single();

  const { data: allowedEmails } = await supabase
    .from("allowed_emails")
    .select("email, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav userEmail={user.email ?? ""} />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Configurações gerais
          </h1>
          <p className="text-sm text-neutral-500">
            Regra padrão da rotina mensal. Cada cliente pode ter exceções no
            próprio cadastro.
          </p>
        </div>
        <ConfigForm config={config as ConfigGeral} />

        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Quem pode acessar o painel
          </h2>
          <p className="text-sm text-neutral-500">
            Login restrito a e-mails Google cadastrados aqui.
          </p>
        </div>
        <AllowlistManager
          emails={allowedEmails ?? []}
          currentUserEmail={user.email ?? ""}
        />
      </main>
    </div>
  );
}
