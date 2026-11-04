"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Atividade, CanalEnvio, Cliente } from "@/lib/types";
import { ATIVIDADE_LABELS, CANAL_LABELS } from "@/lib/types";
import { VARIAVEIS_DISPONIVEIS } from "@/lib/mensagem";
import { cnpjValido, somenteDigitos } from "@/lib/cnpj";

type FormState = {
  codigo: string;
  nome: string;
  cnpj: string;
  telefone: string;
  atividade: Atividade;
  ativo: boolean;
  pausado: boolean;
  debito_automatico: boolean;
  dia_aviso_override: string;
  margem_atraso_override: string;
  mensagem_template_override: string;
  canal_envio_override: CanalEnvio | "";
  observacoes: string;
};

function toForm(c: Cliente | null): FormState {
  return {
    codigo: c?.codigo ?? "",
    nome: c?.nome ?? "",
    cnpj: c?.cnpj ?? "",
    telefone: c?.telefone ?? "",
    atividade: c?.atividade ?? "outra",
    ativo: c?.ativo ?? true,
    pausado: c?.pausado ?? false,
    debito_automatico: c?.debito_automatico ?? false,
    dia_aviso_override: c?.dia_aviso_override?.toString() ?? "",
    margem_atraso_override: c?.margem_atraso_override?.toString() ?? "",
    mensagem_template_override: c?.mensagem_template_override ?? "",
    canal_envio_override: c?.canal_envio_override ?? "",
    observacoes: c?.observacoes ?? "",
  };
}

export default function ClienteModal({
  cliente,
  onClose,
  onSaved,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(toForm(cliente));
  const [showExcecoes, setShowExcecoes] = useState(
    !!(cliente?.dia_aviso_override || cliente?.margem_atraso_override ||
      cliente?.mensagem_template_override || cliente?.canal_envio_override)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const cnpjLimpo = somenteDigitos(form.cnpj);
    if (!cnpjValido(cnpjLimpo)) {
      setError("CNPJ inválido: confira os 14 dígitos.");
      setSaving(false);
      return;
    }

    const payload = {
      codigo: form.codigo || null,
      nome: form.nome,
      cnpj: cnpjLimpo,
      telefone: form.telefone,
      atividade: form.atividade,
      ativo: form.ativo,
      pausado: form.pausado,
      debito_automatico: form.debito_automatico,
      dia_aviso_override: form.dia_aviso_override ? Number(form.dia_aviso_override) : null,
      margem_atraso_override: form.margem_atraso_override
        ? Number(form.margem_atraso_override)
        : null,
      mensagem_template_override: form.mensagem_template_override || null,
      canal_envio_override: form.canal_envio_override || null,
      observacoes: form.observacoes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = cliente
      ? await supabase.from("clientes").update(payload).eq("id", cliente.id)
      : await supabase.from("clientes").insert(payload);

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-neutral-900">
          {cliente ? "Editar cliente" : "Novo cliente"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código (ex.: C01)">
              <input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Atividade">
              <select
                value={form.atividade}
                onChange={(e) =>
                  setForm({ ...form, atividade: e.target.value as Atividade })
                }
                className="input"
              >
                {Object.entries(ATIVIDADE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Nome *">
            <input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CNPJ *">
              <input
                required
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className="input"
                placeholder="00000000000000"
              />
            </Field>
            <Field label="Telefone (WhatsApp) *">
              <input
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="input"
                placeholder="+55 11 99999-9999"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Ativo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pausado}
                onChange={(e) => setForm({ ...form, pausado: e.target.checked })}
              />
              Pausado (não gera nem envia este mês)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.debito_automatico}
                onChange={(e) =>
                  setForm({ ...form, debito_automatico: e.target.checked })
                }
              />
              Débito automático (sai da geração mensal)
            </label>
          </div>

          <Field label="Observações">
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="input"
              rows={2}
            />
          </Field>

          <button
            type="button"
            onClick={() => setShowExcecoes((v) => !v)}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
          >
            {showExcecoes ? "− Ocultar exceções deste cliente" : "+ Exceções deste cliente (aviso, atraso, mensagem, canal)"}
          </button>

          {showExcecoes && (
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">
                Em branco = usa a configuração geral do escritório.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dia do aviso (1–28)">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={form.dia_aviso_override}
                    onChange={(e) =>
                      setForm({ ...form, dia_aviso_override: e.target.value })
                    }
                    className="input"
                  />
                </Field>
                <Field label="Margem de atraso (dias)">
                  <input
                    type="number"
                    min={0}
                    value={form.margem_atraso_override}
                    onChange={(e) =>
                      setForm({ ...form, margem_atraso_override: e.target.value })
                    }
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Canal de envio">
                <select
                  value={form.canal_envio_override}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      canal_envio_override: e.target.value as CanalEnvio | "",
                    })
                  }
                  className="input"
                >
                  <option value="">(usar padrão)</option>
                  {Object.entries(CANAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mensagem personalizada">
                <textarea
                  value={form.mensagem_template_override}
                  onChange={(e) =>
                    setForm({ ...form, mensagem_template_override: e.target.value })
                  }
                  className="input font-mono text-xs"
                  rows={3}
                  placeholder={VARIAVEIS_DISPONIVEIS.join(" ")}
                />
              </Field>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
