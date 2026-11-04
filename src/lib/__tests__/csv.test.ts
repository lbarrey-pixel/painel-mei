import { describe, expect, it } from "vitest";
import { dividirLinha, gerarCsv, lerCsv } from "../csv";

describe("dividirLinha", () => {
  it("respeita aspas e aspas duplicadas", () => {
    expect(dividirLinha('a;"b;c";"d ""e""";f', ";")).toEqual(["a", "b;c", 'd "e"', "f"]);
  });

  it("funciona com vírgula e campos vazios", () => {
    expect(dividirLinha("x,,z", ",")).toEqual(["x", "", "z"]);
  });
});

describe("lerCsv", () => {
  const cabecalho = "id;nome;cnpj;telefone;atividade;ativo";

  it("lê linhas válidas e normaliza CNPJ e atividade", () => {
    const { registros, erros } = lerCsv(
      [cabecalho, 'C01;"Padaria; do Bairro";11.222.333/0001-81;+55 11 91234-0001;comercio;1', ";Oficina;22333444000181;11 9;inexistente;0"].join("\r\n"),
    );
    expect(erros).toEqual([]);
    expect(registros).toEqual([
      { codigo: "C01", nome: "Padaria; do Bairro", cnpj: "11222333000181", telefone: "+55 11 91234-0001", atividade: "comercio", ativo: true },
      { codigo: null, nome: "Oficina", cnpj: "22333444000181", telefone: "11 9", atividade: "outra", ativo: false },
    ]);
  });

  it("aceita separador vírgula e assume ativo quando a coluna não existe", () => {
    const { registros } = lerCsv("nome,cnpj,telefone\nLoja,11222333000181,1");
    expect(registros[0]).toMatchObject({ ativo: true, atividade: "outra", codigo: null });
  });

  it("cancela a importação inteira se qualquer linha tiver erro, apontando a linha", () => {
    const { registros, erros } = lerCsv([cabecalho, "C01;Boa;11222333000181;1;comercio;1", "C02;Ruim;11222333000182;1;comercio;1", "C03;;11222333000181;;;"].join("\n"));
    expect(registros).toEqual([]);
    expect(erros).toEqual(["linha 3: CNPJ inválido", "linha 4: nome vazio", "linha 4: CNPJ repetido no arquivo", "linha 4: telefone vazio"]);
  });

  it("exige as colunas obrigatórias", () => {
    expect(lerCsv("nome;telefone\nx;1").erros).toEqual(["faltam colunas: cnpj"]);
    expect(lerCsv("").erros).toEqual(["arquivo vazio"]);
  });
});

describe("gerarCsv", () => {
  it("escapa separador e aspas e faz ida e volta com lerCsv", () => {
    const clientes = [
      { codigo: "C01", nome: 'Padaria "Boa"; Ltda', cnpj: "11222333000181", telefone: "+55 11 91234-0001", atividade: "comercio" as const, ativo: true },
      { codigo: null, nome: "Oficina", cnpj: "22333444000181", telefone: "1", atividade: "servicos" as const, ativo: false },
    ];
    const csv = gerarCsv(clientes);
    expect(csv.split("\n")[1]).toBe('C01;"Padaria ""Boa""; Ltda";11222333000181;+55 11 91234-0001;comercio;1');
    expect(lerCsv(csv).registros).toEqual(clientes);
  });
});
