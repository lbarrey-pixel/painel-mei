import { describe, expect, it } from "vitest";
import { cnpjValido, formatarCnpj, somenteDigitos } from "../cnpj";

describe("cnpjValido", () => {
  it("aceita CNPJ com dígitos verificadores corretos, com ou sem máscara", () => {
    expect(cnpjValido("11222333000181")).toBe(true);
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(cnpjValido("11222333000182")).toBe(false);
    expect(cnpjValido("11222333000191")).toBe(false);
  });

  it("rejeita tamanho errado e sequências repetidas", () => {
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
  });
});

describe("formatarCnpj", () => {
  it("aplica a máscara só quando há 14 dígitos", () => {
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatarCnpj("123")).toBe("123");
  });
});

it("somenteDigitos remove tudo que não é número", () => {
  expect(somenteDigitos("+55 (11) 9.1234-0001")).toBe("5511912340001");
});
