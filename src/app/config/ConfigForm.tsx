"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CanalEnvio, ConfigGeral } from "@/lib/types";
import { CANAL_LABELS } from "@/lib/types";
import { VARIAVEIS_DISPONIVEIS } from "@/lib/mensagem";

export default function ConfigForm({ config }: { config: ConfigGeral }) {
  const router = useRouter();
  const supabase = createClient();
  const [diaAviso, setDiaAviso] = useState(config.dia_aviso_padrao);
  const [margem, setMargem] = useState(config.margem_atraso_dias);
  const [template, setTemplate] = useState(config.mensagem_template_padrao);
  const [canal, setCanal] = useState<CanalEnvio>(config.canal_envio_padrao);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("config_geral")
      .update({
        dia_aviso_padrao: diaAviso,
        margem_atraso_dias: margem,
        mensagem_template_padrao: template,
        canal_envio_padrao: canal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    setSaving(false);
    if (error) {
      setMsg(`Erro: ${error.message}`);
    } else {
      setMsg("Salvo.");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Dia do mês para avisar o operador (1–28)
          </span>
          <input
            type="number"
            min={1}
            max={28}
            value={diaAviso}
            onChange={(e) => setDiaAviso(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">
            Margem de atraso (dias antes do vencimento)
          </span>
          <input
            type="number"
            min={0}
            value={margem}
            onChange={(e) => setMargem(Number(e.target.value))}
            className="input"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-600">
          Canal de envio padrão
        </span>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value as CanalEnvio)}
          className="input"
        >
          {Object.entries(CANAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-600">
          Mensagem padrão (variáveis: {VARIAVEIS_DISPONIVEIS.join(" ")})
        </span>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="input font-mono text-xs"
          rows={4}
        />
      </label>

      {msg && <p className="text-sm text-neutral-600">{msg}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar configurações"}
      </button>
    </form>
  );
}
