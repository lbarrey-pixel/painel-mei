import { expect, it } from "vitest";
import { montarMensagem } from "../mensagem";

it("substitui todas as variáveis, inclusive repetidas", () => {
  const texto = montarMensagem("Olá {nome}! Guia {competencia}, vence {vencimento}: {valor}. ({competencia})", {
    competencia: "10/2026",
    vencimento: "20/11/2026",
    valor: "R$ 80,00",
    nome: "Ana",
  });
  expect(texto).toBe("Olá Ana! Guia 10/2026, vence 20/11/2026: R$ 80,00. (10/2026)");
});

it("nome ausente vira vazio", () => {
  expect(montarMensagem("Oi {nome}.", { competencia: "", vencimento: "", valor: "" })).toBe("Oi .");
});
