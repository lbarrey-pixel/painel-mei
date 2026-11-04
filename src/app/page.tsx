import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ClientesTable from "./ClientesTable";
import type { Cliente } from "@/lib/types";

export default async function ClientesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("*")
    .order("codigo", { ascending: true, nullsFirst: false });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Nav userEmail={user.email ?? ""} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              Clientes MEI
            </h1>
            <p className="text-sm text-neutral-500">
              {clientes?.length ?? 0} clientes cadastrados
            </p>
          </div>
        </div>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Erro ao carregar clientes: {error.message}
          </p>
        )}
        <ClientesTable clientes={(clientes as Cliente[]) ?? []} />
      </main>
    </div>
  );
}
