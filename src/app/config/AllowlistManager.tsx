"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AllowedEmail {
  email: string;
  created_at: string;
}

export default function AllowlistManager({
  emails,
  currentUserEmail,
}: {
  emails: AllowedEmail[];
  currentUserEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = novo.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg("E-mail inválido.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("allowed_emails")
      .insert({ email, added_by: currentUserEmail });
    setBusy(false);
    if (error) {
      setMsg(`Erro: ${error.message}`);
    } else {
      setNovo("");
      setMsg(null);
      router.refresh();
    }
  };

  const remover = async (email: string) => {
    if (email === currentUserEmail) {
      if (!confirm("Isso vai remover o SEU próprio acesso. Continuar?")) return;
    }
    setBusy(true);
    const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
    setBusy(false);
    if (error) setMsg(`Erro: ${error.message}`);
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <form onSubmit={adicionar} className="mb-4 flex gap-2">
        <input
          type="email"
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="email@gmail.com"
          className="input"
        />
        <button
          type="submit"
          disabled={busy}
          className="whitespace-nowrap rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          + Adicionar
        </button>
      </form>
      {msg && <p className="mb-3 text-sm text-red-600">{msg}</p>}
      <ul className="divide-y divide-neutral-100">
        {emails.map((e) => (
          <li key={e.email} className="flex items-center justify-between py-2 text-sm">
            <span className="text-neutral-800">
              {e.email}
              {e.email === currentUserEmail && (
                <span className="ml-2 text-xs text-neutral-400">(você)</span>
              )}
            </span>
            <button
              onClick={() => remover(e.email)}
              className="text-xs font-medium text-red-500 hover:text-red-700"
            >
              Remover
            </button>
          </li>
        ))}
        {emails.length === 0 && (
          <li className="py-2 text-sm text-neutral-400">Nenhum e-mail liberado ainda.</li>
        )}
      </ul>
    </div>
  );
}
