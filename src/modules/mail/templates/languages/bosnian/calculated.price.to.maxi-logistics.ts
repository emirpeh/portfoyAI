export interface BosnianCalculatedPriceTemplateProps {
  offerNo: string;
  calculatedPrice: string;
}

/* --- Naslov (ostaje isti) ---------------------------------------- */
export const createBosnianCalculatedPriceTitleTemplate = (offerNo: string) =>
  `Cijena Ponude - ${offerNo}`;

/* --- HTML tijelo ------------------------------------------------- */
export const createBosnianCalculatedPriceTemplate = ({
  offerNo,
  calculatedPrice,
}: BosnianCalculatedPriceTemplateProps) => {
  /* npr. “1.250,00 EUR” */
  const prettyPrice =
    new Intl.NumberFormat('bs-BA', { minimumFractionDigits: 2 }).format(
      Number(calculatedPrice),
    ) + ' EUR';

  return /* html */ `
<div style="font-family: Arial, sans-serif; line-height:1.6;">
  Poštovani,<br><br>

  Zahvaljujemo Vam na interesovanju za naše usluge.<br><br>

  Za Vaš upit <b>br. ${offerNo}</b> dostavljamo sljedeću parcijalnu (LTL) ponudu u
  iznosu od <b>${prettyPrice}</b>.<br><br>

  <u>Dodatni troškovi / napomene</u><br>
  • Špedicija u inostranstvu (1&nbsp;HS kod) +100&nbsp;EUR  
    (izuzetak&nbsp;CH, UK, IE, GR)<br>
  • Konsolidirani polasci: <b>petak</b> i <b>subota</b><br>
  • Procijenjeno tranzitno vrijeme pri normalnom prometu na granici: <b>xxx</b> dana*<br><br>

  <ul style="margin:0 0 16px 16px; padding:0;">
    <li>U slučaju privremenog izvoza, tranzita ili trostrane prodaje, navlon se može revidirati.</li>
    <li>Ponuda važi za nerizičnu robu (bez ADR/IMO).</li>
    <li>Sanitarne i radiometrijske takse nisu uključene u cijenu.</li>
    <li>Besplatno vrijeme utovara za parcijalu: 6&nbsp;sati; nakon toga 200&nbsp;€/dan čekanja.</li>
    <li>Namještaj, mermer i staklo nisu pokriveni CMR osiguranjem.</li>
    <li>Za robu vrijednosti &gt; 50&nbsp;000&nbsp;EUR obračunava se dodatni depozit.</li>
    <li>Ponuda važi 5 radnih dana; plaćanje avansno po utovaru.</li>
    <li>Cijena se odnosi na standardnu šlepu s ceradom.</li>
  </ul>

  Nadamo se da Vam ponuda odgovara te se radujemo Vašoj narudžbi.<br><br>

  <b>Destinacije koje redovno pokrivamo (izbor)</b><br>
  Balkan – Sjeverna Makedonija, Albanija, Kosovo, Srbija, Hrvatska, Grčka, Rumunija, Bugarska…<br>
  Evropa – Njemačka, Nizozemska, Belgija, Francuska, Italija, Austrija, Švicarska, Skandinavija, Španija, Portugal…<br><br>

  Da li ste već probali našu <i>Express Panel-van</i> ili intermodalnu uslugu?<br><br>

  Srdačan pozdrav,<br>
  Maxi Logistics
</div>
`.trim();
};
