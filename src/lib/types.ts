export type Atividade = "comercio" | "servicos" | "comercio_servicos" | "outra";
export type CanalEnvio = "whatsapp_web" | "meta_api";
export type Frequencia = "mensal" | "personalizada";

export interface Cliente {
  id: string;
  codigo: string | null;
  nome: string;
  cnpj: string;
  telefone: string;
  atividade: Atividade;
  ativo: boolean;
  pausado: boolean;
  debito_automatico: boolean;
  frequencia: Frequencia;
  frequencia_config: Record<string, unknown> | null;
  dia_aviso_override: number | null;
  margem_atraso_override: number | null;
  mensagem_template_override: string | null;
  canal_envio_override: CanalEnvio | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfigGeral {
  id: true;
  dia_aviso_padrao: number;
  margem_atraso_dias: number;
  mensagem_template_padrao: string;
  canal_envio_padrao: CanalEnvio;
  updated_at: string;
}

export const ATIVIDADE_LABELS: Record<Atividade, string> = {
  comercio: "Comércio",
  servicos: "Serviços",
  comercio_servicos: "Comércio + Serviços",
  outra: "Outra",
};

export const CANAL_LABELS: Record<CanalEnvio, string> = {
  whatsapp_web: "WhatsApp Web (robô de envio local)",
  meta_api: "WhatsApp Business API (Meta)",
};
