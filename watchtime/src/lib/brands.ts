/**
 * Marcas de relojoaria consideradas "boas" para o filtro padrão.
 * Ficam de fora marcas de moda e marcas próprias de loja. Ajuste à vontade.
 */
export const GOOD_BRANDS = [
  "Seiko", "Orient", "Citizen", "Casio", "G-Shock", "Edifice", "Tissot", "Bulova", "Hamilton",
  "Swatch", "Timex", "Victorinox", "Certina", "Mido", "Longines", "Rado", "TAG Heuer", "Oris",
  "Frederique Constant", "Festina", "Lorus", "Luminox", "Wenger", "Baume & Mercier", "Montblanc",
  "Omega", "Breitling", "Tudor", "Rolex", "Cartier", "Zenith", "IWC", "Grand Seiko", "Junghans",
  "Nomos", "Sinn", "Maurice Lacroix", "Raymond Weil", "Glycine", "Vostok", "Fossil",
  "Hublot", "IWC Schaffhausen", "Jaeger-LeCoultre", "Panerai", "Bvlgari", "Bulgari", "Chopard",
  "Audemars Piguet", "Patek Philippe", "Vacheron Constantin", "Breguet", "Blancpain",
  "Girard-Perregaux", "Ulysse Nardin", "Bell & Ross", "Piaget", "Jaquet Droz", "Glashütte Original",
  // importados / microbrands (Clock Society, New Store RJ)
  "Christopher Ward", "Baltic", "Beaubleu", "Nivada Grenchen", "Raketa", "Brew", "Vulcain", "Yema",
  "Lorier", "Farer", "Dan Henry", "Spinnaker", "Squale", "Doxa", "Steinhart", "Formex", "Furlan Marri",
  "Serica", "Unimatic", "Halios", "Ming", "Rec", "Marathon", "Zodiac", "Traska", "Monta", "Mido",
  "Laco", "Stowa", "Archimede", "Damasko", "Fortis", "Oris", "Eterna", "Alpina", "Rado", "Movado",
];

/** Deduz a marca pelo nome do produto (lojas que não a informam em campo próprio). */
export function inferBrand(name: string): string | null {
  const n = ` ${name.toLowerCase()} `;
  let best: string | null = null;
  for (const b of GOOD_BRANDS) {
    const t = ` ${b.toLowerCase()} `;
    if (n.includes(t) && (!best || b.length > best.length)) best = b;
  }
  return best;
}
