export interface SlovenianCalculatedPriceTemplateProps {
  offerNo: string;
  calculatedPrice: string; // npr. "1 250,00"
}

/* Zadeva (ostane nespremenjena) */
export const createSlovenianCalculatedPriceTitleTemplate = (offerNo: string) =>
  `Cena Ponudbe - ${offerNo}`;

/* Daljša HTML predloga */
export const createSlovenianCalculatedPriceTemplate = ({
  offerNo,
  calculatedPrice,
}: SlovenianCalculatedPriceTemplateProps) => {
  return /* html */ `
<div style="font-family: Arial, sans-serif; line-height:1.6;">
  Spoštovani,<br><br>

  Najlepša hvala za izkazano zanimanje za naše storitve.<br><br>

  Za vaše povpraševanje <b>št. ${offerNo}</b> vam posredujemo delno (LTL) ponudbo v višini
  <b>${calculatedPrice}&nbsp;EUR</b>.<br><br>

  <u>Dodatni stroški / opombe</u><br>
  • Carinjenje v tujini (1&nbsp;HS koda): +100&nbsp;EUR (razen CH, UK, IE, GR).<br>
  • Konsolidirani odhodi: <b>petek</b> in <b>sobota</b>.<br>
  • Predviden tranzitni čas ob normalnem prometu na mejah: <b>xxx</b> dni.*<br><br>

  <ul style="margin:0 0 16px 16px; padding:0;">
    <li>V primeru začasnega izvoza, tranzita ali tristranske prodaje se lahko cena prilagodi.</li>
    <li>Ponudba velja za ne-nevarno blago (brez ADR/IMO).</li>
    <li>Sanitarni in radiometrični stroški niso vključeni v ceno.</li>
    <li>Brezplačni čas nakladanja pri delnem tovornem prostoru je 6&nbsp;ur; prekoračitev se zaračuna 200&nbsp;€/dan.</li>
    <li>Pohištvo, marmor in steklo niso zajeti v zavarovanju CMR.</li>
    <li>Za vrednost blaga nad 50&nbsp;000&nbsp;EUR se zaračuna dodatno jamstvo.</li>
    <li>Ponudba velja 5 delovnih dni; plačilo vnaprej ob nakladanju.</li>
    <li>Cene veljajo za standardno polpriklopno vozilo.</li>
  </ul>

  Upamo, da vam ponudba ustreza, in se veselimo vašega naročila.<br><br>

  <b>Pokrite destinacije (izvleček)</b><br>
  Balkan: Severna Makedonija, Albanija, Črna gora, Kosovo, Srbija, Hrvaška, Bosna in Hercegovina, Grčija, Romunija, Bolgarija …<br>
  Evropa: Slovenija, Madžarska, Slovaška, Češka, Poljska, Avstrija, Švica, Nemčija, Nizozemska, Belgija, Francija, Italija, Skandinavija, Španija, Portugalska …<br><br>

  Ste že preizkusili našo hitro dostavo s panel-van vozili
  ali intermodalne transportne rešitve?<br><br>

  Lep pozdrav,<br>
  Maxi Logistics
</div>
`.trim();
};
