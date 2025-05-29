export interface TurkishCalculatedPriceTemplateProps {
  offerNo: string;
  originalPrice: string; // kullanılmıyor ama yapıyı koruyoruz
  calculatedPrice: string;
  rate: string; // kullanılmıyor
  profitMargin: string; // kullanılmıyor
  supplierContact: {
    // kullanılmıyor
    name: string;
    email: string;
    companyName: string;
  };
}

export const createTurkishCalculatedPriceTitleTemplate = (offerNo: string) =>
  `Teklif Fiyatı - ${offerNo}`;

export const createTurkishCalculatedPriceTemplate = ({
  offerNo,
  calculatedPrice,
}: TurkishCalculatedPriceTemplateProps) => {
  /* Örn. "1 250,00-Euro" biçimi */
  const prettyPrice =
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
    }).format(Number(calculatedPrice)) + '-Euro';

  return /* html */ `
<div style="font-family: Arial, sans-serif; line-height:1.6;">
  Merhabalar,<br><br>

  Öncelikle şirketimize göstermiş olduğunuz ilgi için teşekkür ederiz.<br><br>

  <b>${offerNo}</b> numaralı sevkiyatınız için parsiyel fiyat teklifimiz
  <b>${prettyPrice}</b>'dur.<br><br>

  Yurtdışı Gümrükleme Ücreti (tek GTIP) +100 EUR’dur.
  (İsviçre, İngiltere, İrlanda ve Yunanistan hariç)<br><br>

  Parsiyel çıkışlarımız <b>Cuma</b> ve <b>Cumartesi</b> günleri gerçekleşmektedir.<br>
  Transit süre araç çıkışına müteakip hudut kapılarında yoğunluk olmaması hâlinde
  <b>xxx</b> gün olarak baz alabilirsiniz.<br><br>

  <ul style="margin:0 0 16px 16px; padding:0;">
    <li>Belirtilmediği sürece Geçici İhracat, Transit veya 3'lü satışta navlun revize edilir.</li>
    <li>Teklif ADR / IMO içermeyen zararsız yükler için geçerlidir.</li>
    <li>Sanitary ve Radyometrik ücretler navluna dâhil değildir.</li>
    <li>Parsiyel serbest süre 6 saat; aşımda 200 €/gün bekleme uygulanır.</li>
    <li>Mobilya, mermer ve cam yüklemeleri CMR sigorta kapsamı dışındadır.</li>
    <li>Mal bedeli 50 000 EUR’yu aşarsa ek teminat bedeli yansıtılır.</li>
    <li>Navlun teklifi 5 iş günü geçerlidir; ödeme yüklemeye müteakip peşindir.</li>
    <li>Fiyat standart TIR için verilmiştir.</li>
  </ul>

  Teklifimizi olumlu bulacağınızı ümit eder, değerli siparişlerinizi bekleriz.<br><br>

  <b>Çalıştığımız ülkeler (örnek):</b><br>
  Balkanlar – Kuzey Makedonya, Arnavutluk, …<br>
  Avrupa – Almanya, Hollanda, Belçika, …<br><br>

  Ekspres Panelvan&nbsp;ve&nbsp;Intermodal taşımacılık hizmetlerimizi denediniz mi?<br><br>

  Saygılarımızla,<br>
  Maxi Logistics
</div>
`.trim();
};
