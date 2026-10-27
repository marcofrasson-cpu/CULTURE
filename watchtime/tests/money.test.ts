import { describe, expect, it } from "vitest";
import { brl, toCents } from "@/lib/money";
import { scoreDeal, discountPct } from "@/lib/score";

describe("toCents", () => {
  it("aceita número, pt-BR e en-US", () => {
    expect(toCents(1299.9)).toBe(129990);
    expect(toCents("1.299,90")).toBe(129990);
    expect(toCents("1299.90")).toBe(129990);
    expect(toCents("R$ 899,00")).toBe(89900);
    expect(toCents("")).toBeNull();
    expect(toCents(null)).toBeNull();
  });
});

describe("brl", () => {
  it("formata centavos", () => expect(brl(129990).replace(/\s/g, " ")).toBe("R$ 1.299,90"));
});

describe("score", () => {
  it("desconto sobre preço de", () => {
    expect(discountPct(70000, 100000)).toBe(30);
    expect(scoreDeal({ price: 70000, listPrice: 100000, minPrice: 70000, prevPrice: null })).toBe(45);
  });
  it("sem sinal de oferta = 0", () => {
    expect(scoreDeal({ price: 100000, listPrice: null, minPrice: 90000, prevPrice: null })).toBe(0);
    expect(scoreDeal({ price: 100000, listPrice: 100000, minPrice: 100000, prevPrice: 100000 })).toBe(0);
  });
  it("queda desde a última varredura pesa mais", () => {
    expect(scoreDeal({ price: 80000, listPrice: null, minPrice: 80000, prevPrice: 100000 })).toBe(45);
  });
});
