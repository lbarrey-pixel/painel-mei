"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cliente } from "@/lib/types";
import { ATIVIDADE_LABELS } from "@/lib/types";
import { formatarCnpj } from "@/lib/cnpj";
import { gerarCsv, lerCsv } from "@/lib/csv";
import ClienteModal from "./ClienteModal";

export default function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Cliente | null | "new">(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const togglePausado = async (cliente: Cliente) => {
    setBusy(true);
    const { error } = await supabase
      .from("clientes")
      .update({ pausado: !cliente.pausado })
      .eq("id", cliente.id);
    setBusy(false);
    if (error) setMsg(`Erro: ${error.message}`);
    router.refresh();
  };

  const excluir = async (cliente: Cliente) => {
    if (!confirm(`Excluir ${cliente.nome}? Essa ação não pode ser desfeita.`))
      return;
    setBusy(true);
    const { error } = await supabase.from("clientes").delete().eq("id", cliente.id);
    setBusy(false);
    if (error) setMsg(`Erro: ${error.message}`);
    router.refresh();
  };

  const exportarCsv = () => {
    const blob = new Blob([gerarCsv(clientes)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_painel-mei_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importarCsv = async (file: File) => {
    const { registros, erros } = lerCsv(await file.text());
    if (erros.length > 0) {
      setMsg(`Importação cancelada: ${erros.length} erro(s). Primeiro: ${erros[0]}.`);
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("clientes")
      .upsert(registros, { onConflict: "cnpj" });
    setBusy(false);
    if (error) {
      setMsg(`Erro ao importar: ${error.message}`);
    } else {
      setMsg(`${registros.length} cliente(s) importado(s)/atualizado(s).`);
      router.refresh();
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setEditing("new")}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          + Novo cliente
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Importar CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importarCsv(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={exportarCsv}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Exportar CSV
        </button>
        {busy && <span className="self-center text-xs text-neutral-400">processando…</span>}
      </div>

      {msg && (
        <p className="mb-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-700">
          {msg}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">CNPJ</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">Atividade</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2 text-neutral-500">{c.codigo ?? "—"}</td>
                <td className="px-4 py-2 font-medium text-neutral-900">{c.nome}</td>
                <td className="px-4 py-2 text-neutral-500">{formatarCnpj(c.cnpj)}</td>
                <td className="px-4 py-2 text-neutral-500">{c.telefone}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {ATIVIDADE_LABELS[c.atividade]}
                </td>
                <td className="px-4 py-2">
                  {!c.ativo ? (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      Inativo
                    </span>
                  ) : c.pausado ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      Pausado
                    </span>
                  ) : c.debito_automatico ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Débito automático
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Ativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      onClick={() => setEditing(c)}
                      className="font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => togglePausado(c)}
                      className="font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      {c.pausado ? "Retomar" : "Pausar"}
                    </button>
                    <button
                      onClick={() => excluir(c)}
                      className="font-medium text-red-500 hover:text-red-700"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ClienteModal
          cliente={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
