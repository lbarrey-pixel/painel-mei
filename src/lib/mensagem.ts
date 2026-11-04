// Monta o texto final da mensagem a partir do template e das variáveis da guia.
// O painel usa para pré-visualizar; o robô de envio lê o mesmo template e escolhe o canal
// (hoje WhatsApp Web; a API oficial da Meta entra com o mesmo contrato de variáveis).

export interface VariaveisMensagem {
  competencia: string; // ex.: "10/2026"
  vencimento: string; // ex.: "23/11/2026"
  valor: string; // ex.: "R$ 86,05"
  nome?: string;
}

export function montarMensagem(template: string, vars: VariaveisMensagem): string {
  return template
    .replaceAll("{competencia}", vars.competencia)
    .replaceAll("{vencimento}", vars.vencimento)
    .replaceAll("{valor}", vars.valor)
    .replaceAll("{nome}", vars.nome ?? "");
}

export const VARIAVEIS_DISPONIVEIS = [
  "{competencia}",
  "{vencimento}",
  "{valor}",
  "{nome}",
] as const;
