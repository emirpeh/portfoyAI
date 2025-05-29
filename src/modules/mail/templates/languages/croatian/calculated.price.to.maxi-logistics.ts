export interface CroatianCalculatedPriceTemplateProps {
  offerNo: string;
  calculatedPrice: string; // npr. "1 250,00"
}

export const createCroatianCalculatedPriceTitleTemplate = (offerNo: string) =>
  `Cijena Ponude - ${offerNo}`;

export const createCroatianCalculatedPriceTemplate = ({
  offerNo,
  calculatedPrice,
}: CroatianCalculatedPriceTemplateProps) => {
  /* Format npr. “1.250,00 EUR” */
  const prettyPrice =
    new Intl.NumberFormat('hr-HR', { minimumFractionDigits: 2 }).format(
      Number(calculatedPrice),
    ) + ' EUR';

  return /* html */ `
<div style="font-family: Arial, sans-serif; line-height:1.6;">
  Poštovani,<br><br>

  Zahvaljujemo na interesu za naše usluge.<br><br>

  Za vaš upit <b>br. ${offerNo}</b> dostavljamo sljedeću
  parcijalnu (LTL) ponudu u iznosu od <b>${prettyPrice}</b>.<br><br>

  <u>Dodatni troškovi / napomene</u><br>
  • Špedicija u inozemstvu (1&nbsp;HS kod) +100&nbsp;EUR  
    (iznimka&nbsp;CH, UK, IE, GR)<br>
  • Konsolidirani polasci: <b>petak</b> i <b>subota</b><br>
  • Procijenjeno tranzitno vrijeme (uobičajen promet na granici): <b>xxx</b> dana*<br><br>

  <ul style="margin:0 0 16px 16px; padding:0;">
    <li>U slučaju privremenog izvoza, tranzita ili trostrane prodaje cijena se može revidirati.</li>
    <li>Ponuda vrijedi za neopasnu robu, bez ADR/IMO klasifikacije.</li>
    <li>Sanitarne i radiometrijske pristojbe nisu uključene u cijenu.</li>
    <li>Besplatno vrijeme utovara za parcijalu: 6&nbsp;sati; nakon toga 200&nbsp;€/dan čekanja.</li>
    <li>Namet na robu od drveta, mramora i stakla nije pokriven CMR osiguranjem.</li>
    <li>Za vrijednost robe &gt; 50&nbsp;000&nbsp;EUR naplaćuje se dodatni depozit.</li>
    <li>Ponuda vrijedi 5 radnih dana; plaćanje avansno po utovaru.</li>
    <li>Cijena se odnosi na standardnu ceradnu poluprikolicu.</li>
  </ul>

  Nadamo se da će vam ponuda odgovarati te iščekujemo vašu narudžbu.<br><br>

  <b>Destinacije koje redovito pokrivamo (izbor)</b><br>
  Balkan – Sjeverna Makedonija, Albanija, Kosovo, Srbija, Bosna i Hercegovina, Grčka, Rumunjska, Bugarska…<br>
  Europa – Njemačka, Nizozemska, Belgija, Francuska, Italija, Austrija, Švicarska, Skandinavija, Španjolska, Portugal…<br><br>

  Jeste li već isprobali našu <i>Express Panel-van</i> ili intermodalnu uslugu?<br><br>

  Srdačan pozdrav,<br>
  Maxi Logistics
</div>
`.trim();
};
