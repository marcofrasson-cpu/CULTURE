import { describe, expect, it } from "vitest";
import { parseMm, parseSpecs } from "@/lib/scrape/specs";

describe("parseMm", () => {
  it("mm, cm, dimensões e faixa", () => {
    expect(parseMm("38 mm", false)).toBe(38);
    expect(parseMm("4,0", true)).toBe(40);
    expect(parseMm("40", true)).toBe(40);
    expect(parseMm("22x32mm", false)).toBe(32);
    expect(parseMm("31 a 40 mm", false)).toBeNull();
    expect(parseMm("Médio", false)).toBeNull();
  });
});

describe("parseSpecs", () => {
  it("lê gênero e caixa das specs", () => {
    const r = parseSpecs("Relógio Fossil Minimalist", ["Gênero", "Largura da Caixa (cm)", "Tamanho"], {
      Gênero: ["Masculino"], "Largura da Caixa (cm)": ["4,2"], Tamanho: ["Grande"],
    });
    expect(r).toEqual({ gender: "masculino", caseMm: 42 });
  });
  it("cai para o nome quando a loja não informa", () => {
    expect(parseSpecs("Relógio Festina Masculino Aço 36mm", ["Tamanho da Caixa"], { "Tamanho da Caixa": ["36 mm"] })).toEqual({ gender: "masculino", caseMm: 36 });
    expect(parseSpecs("Relógio Feminino Cristais", [], {})).toEqual({ gender: "feminino", caseMm: null });
  });
  it("ignora chaves XML e campos de pulseira/vidro", () => {
    const r = parseSpecs("Relógio", ["Genero - XML", "Tamanho do vidro", "Largura da pulseira (mm)"], {
      "Genero - XML": ["Feminino"], "Tamanho do vidro": ["30 mm"], "Largura da pulseira (mm)": ["20 mm"],
    });
    expect(r).toEqual({ gender: null, caseMm: null });
  });
});
