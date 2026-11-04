// Leitura e escrita de CSV para o cadastro de clientes. Aceita ";" ou "," como separador,
// campos entre aspas (com aspas duplicadas dentro) e quebra de linha CRLF.

import type { Atividade } from "./types";
import { cnpjValido, somenteDigitos } from "./cnpj";

export const COLUNAS = ["id", "nome", "cnpj", "telefone", "atividade", "ativo"] as const;
const ATIVIDADES: Atividade[] = ["comercio", "servicos", "comercio_servicos", "outra"];

export interface LinhaCliente {
  codigo: string | null;
  nome: string;
  cnpj: string;
  telefone: string;
  atividade: Atividade;
  ativo: boolean;
}

export interface ResultadoImportacao {
  registros: LinhaCliente[];
  erros: string[];
}

export function detectarSeparador(cabecalho: string): ";" | "," {
  return cabecalho.includes(";") ? ";" : ",";
}

// Divide uma linha respeitando aspas: `a;"b;c";"d ""e"""` → ["a", "b;c", 'd "e"'].
export function dividirLinha(linha: string, sep: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentro = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (dentro) {
      if (ch === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (ch === '"') {
        dentro = false;
      } else {
        atual += ch;
      }
    } else if (ch === '"') {
      dentro = true;
    } else if (ch === sep) {
      campos.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

function escapar(valor: string, sep: string): string {
  return /["\n\r]/.test(valor) || valor.includes(sep) ? `"${valor.replaceAll('"', '""')}"` : valor;
}

export function gerarCsv(clientes: LinhaCliente[], sep = ";"): string {
  const linhas = clientes.map((c) =>
    [c.codigo ?? "", c.nome, c.cnpj, c.telefone, c.atividade, c.ativo ? "1" : "0"].map((v) => escapar(v, sep)).join(sep),
  );
  return [COLUNAS.join(sep), ...linhas].join("\n");
}

// Valida tudo antes de devolver: um erro em qualquer linha cancela a importação inteira.
export function lerCsv(texto: string): ResultadoImportacao {
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return { registros: [], erros: ["arquivo vazio"] };

  const [cabecalho, ...dados] = linhas;
  const sep = detectarSeparador(cabecalho);
  const colunas = dividirLinha(cabecalho, sep).map((c) => c.toLowerCase());
  const idx = Object.fromEntries(COLUNAS.map((c) => [c, colunas.indexOf(c)])) as Record<(typeof COLUNAS)[number], number>;

  const faltando = (["nome", "cnpj", "telefone"] as const).filter((c) => idx[c] === -1);
  if (faltando.length) return { registros: [], erros: [`faltam colunas: ${faltando.join(", ")}`] };

  const erros: string[] = [];
  const vistos = new Set<string>();
  const registros = dados.map((linha, i) => {
    const campos = dividirLinha(linha, sep);
    const campo = (nome: keyof typeof idx) => (idx[nome] === -1 ? "" : (campos[idx[nome]] ?? ""));
    const numero = i + 2; // linha 1 é o cabeçalho
    const cnpj = somenteDigitos(campo("cnpj"));
    const nome = campo("nome");

    if (!nome) erros.push(`linha ${numero}: nome vazio`);
    if (!cnpjValido(cnpj)) erros.push(`linha ${numero}: CNPJ inválido`);
    else if (vistos.has(cnpj)) erros.push(`linha ${numero}: CNPJ repetido no arquivo`);
    vistos.add(cnpj);
    if (!campo("telefone")) erros.push(`linha ${numero}: telefone vazio`);

    const atividadeBruta = campo("atividade") || "outra";
    const atividade = (ATIVIDADES as string[]).includes(atividadeBruta) ? (atividadeBruta as Atividade) : "outra";

    return {
      codigo: campo("id") || null,
      nome,
      cnpj,
      telefone: campo("telefone"),
      atividade,
      ativo: idx.ativo === -1 ? true : campo("ativo") !== "0",
    };
  });

  return { registros: erros.length ? [] : registros, erros };
}
