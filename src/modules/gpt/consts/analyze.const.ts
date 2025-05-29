export const analyzeEmailPrompt = (brokerList: string[]) => {
  const prompt = `
Aşağıdaki e-postalar **Maxi Logistik** (Türkiye) hesabına aittir.  
İçeriği — varsa **önceki mail** ve/veya **önceki teklif** verisiyle birlikte —  
analiz et ve kurallara göre **JSON** döndür.

──────────────────────────────────────────────────────────────────────────────
EKSTRA KURAL — ANLAMLANDIRMA, ŞEHİR, LDM HESABI, FOREIGN TRADE
──────────────────────────────────────────────────────────────────────────────
• Müşteri tarafından verilen herhangi bir bilgi (ülke, şehir, gümrük ofisi, adres vb.)
  doğrudan kopyalanmaz, **doğru, standart, kanonik ve anlaşılır** şekilde şemada yer alır.
  • "TR", "TRK", "Turkey" gibi ülke kısaltmaları → "Türkiye" olarak normalize edilir.
  • Gümrük ofisi adı (“Muratbey Kerry Asav geçici depolama” gibi), *broker listesinde* eşleşiyorsa, "customs" alanına **kanonik adıyla** yazılır.
  • Gümrük ofisinin hangi şehirde olduğu sektörce biliniyorsa, “deliveryCity” veya “loadCity” alanı **doğru şehir adıyla** doldurulur (ör. "Muratbey" → "İstanbul").
  • Adreste gümrük adı varsa ve şehir bilgisi belirlenemiyorsa, ilgili şehir alanı null bırakılır.
• E-posta içeriğinde **boyut/adet ölçüleri** veriliyorsa, “calculatedVolume” ve “calculatedLdm” **mutlaka** hesaplanıp yazılır.
  • Hacim (m³): adet × en × boy × yükseklik
  • LDM: (genişlik (m) × adet) / 2.4 
  • Sadece ölçü eksikse hesap yapılmaz. 
• "foreignTrade" alanı, içerikteki ifadelere göre otomatik belirlenir:
  • "ithalat", "import", "alım" → IM
  • "ihracat", "export", "gönderim" → EX
  • "ithal/ihracat" → TRN
──────────────────────────────────────────────────────────────────────────────
1) GENEL KURALLAR
──────────────────────────────────────────────────────────────────────────────
• Mail *yeni teklif isteği* ise eski veriler **yok sayılır**.  
• Değilse önceki mail/offer verileri **kullanılır**.  
• Eksik / çelişkili bilgi → \`isThereMissingOrIncorrectInformation: true\`.  
• Yanıtlar nazik ve profesyonel olmalı.  
• E-posta içeriğini kullan fakat bu bilgileri \`request\` alanlarına  
  **doğrudan kopyalama**, önce anlamlandır.

\`type\` alanı →  
  CUSTOMER_NEW_OFFER_REQUEST | CUSTOMER_REQUEST_CORRECTION_FROM_CUSTOMER |  
  SUPPLIER_NEW_OFFER | OTHER

──────────────────────────────────────────────────────────────────────────────
2) LOJİSTİK HESAPLAMA
──────────────────────────────────────────────────────────────────────────────
• Standart TIR: 13.60 m × 2.45 m × 2.75 m  (≈ 91.5 m³) • Maks LDM = 13.6  
• Palet ölçüsü varsa →  
  • Hacim (m³) = adet × en × boy × yükseklik (m)  
  • LDM = (palet genişliği (m) × adet) / 2.4  
• Ölçü / adet eksikse hesaplama **yapma**.  
• \`containerDimensions\` değeri m ise ×100 → cm’ye çevir.  
• Sonuçları \`request.calculatedVolume\` ve \`request.calculatedLdm\`
  alanlarına yaz.

──────────────────────────────────────────────────────────────────────────────
3) JSON ŞEMASI  (boş değerler *null* olmalı)
──────────────────────────────────────────────────────────────────────────────
{
  "type": string,
  "offerNo": string | null,
  "from": string,
  "cc": string[] | null,
  "contentTitle": string,
  "contentHtml": string,

  "customer": {
    "name": string | null,
    "email": string | null,
    "gender": "MALE" | "FEMALE" | null
  },

  "language": "turkish" | "english" | "croatian" | "slovenian" | "bosnian" | "macedonian",

  "request": {
    "loadDate": Date | null,
    "loadCountry": string | null,
    "loadCity": string | null,
    "packagingType": string | null,
    "numOfContainers": number | null,
    "containerType": string | null,
    "containerDimensions": string | null,
    "goodsType": string | null,
    "customs": string | null,               // Sadece gümrük ofisi/firma adı, şahsi ad asla olmayacak
    "isStackable": "true" | "false" | null,
    "foreignTrade": "IM" | "EX" | "TRN" | "",
    "deliveryDate": Date | null,
    "deliveryCountry": string | null,
    "deliveryCity": string | null,
    "deliveryPostalCode": string | null,
    "calculatedVolume": number | null,
    "calculatedLdm": number | null
  },

  "offer": {
    "prices": { "price": number, "note": string }[] | null
  },

  "modelResponseTitle": string,
  "modelResponseMail": string,

  "isThereMissingOrIncorrectInformation": boolean,

  "supplierMails": {
    "turkish"?:    { "modelResponseTitle": string, "modelResponseMail": string },
    "english"?:    { "modelResponseTitle": string, "modelResponseMail": string },
    "croatian"?:   { "modelResponseTitle": string, "modelResponseMail": string },
    "slovenian"?:  { "modelResponseTitle": string, "modelResponseMail": string },
    "bosnian"?:    { "modelResponseTitle": string, "modelResponseMail": string },
    "macedonian"?: { "modelResponseTitle": string, "modelResponseMail": string }
  }
}

──────────────────────────────────────────────────────────────────────────────
11) CUSTOMS BROKER EŞLEŞTİRME (GÜMRÜK BİLGİSİ)
──────────────────────────────────────────────────────────────────────────────
• Aşağıdaki **BROKER LİSTESİ** yalnızca Türkiye’de geçerli gümrük ofisi/firma adlarıdır; sadece bu adları (veya varyasyonlarını) tanı ve "customs" alanında kullan.
• Kişi ismi veya şahsi/unvan içeren ifadeleri "customs" alanına ASLA YAZMA.
• Mail gövdesinde bu adların *herhangi bir varyasyonu*  
  (büyük/küçük harf, Türkçe karakter, tire/boşluk farkı, yazım hatası vb.)  
  geçiyorsa **en yakın kanonik** ismi seç ve  
  \`request.customs\` alanına **aynen** yaz.  
• Hiçbir eşleşme yoksa \`request.customs = null\`.  
• Mail metninde gümrük/broker bilgisi olarak şahsi ad, unvan veya kişi ismi geçiyorsa "customs" alanını boş bırak.
• Tahmin yapma.  
• Mail metninde “gümrük / broker / customs” kelimeleri veya BROKER LİSTESİ’nden
  bir ad GEÇMİYORSA 'customs' alanını **kesinlikle doldurma**.

BROKER LİSTESİ (YALNIZCA aşağıdaki isimleri kullan, şahıs/ad/unvan kullanma):
${brokerList.map(b => `- ${b}`).join('\n')}
`;
  return prompt.trim();
};
