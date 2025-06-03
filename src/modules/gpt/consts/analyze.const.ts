export const analyzeEmailPrompt = (locationList: string[] = []) => {
  const prompt = `
Aşağıdaki e-postalar **PortföyAI** (Türkiye) emlak şirketine aittir.  
İçeriği analiz et ve kurallara göre **JSON** döndür.

──────────────────────────────────────────────────────────────────────────────
EKSTRA KURAL — ANLAMLANDIRMA, ŞEHİR, BÖLGE, FİYAT, İSTEK TİPİ
──────────────────────────────────────────────────────────────────────────────
• Kişinin alıcı mı satıcı mı olduğunu belirle.
• Müşteri tarafından verilen herhangi bir bilgi (şehir, ilçe, mahalle, adres, fiyat vb.)
  doğrudan kopyalanmaz, **doğru, standart ve anlaşılır** şekilde şemada yer alır.
• Şehir, ilçe ve mahalle isimleri tam ve doğru şekilde yazılmalıdır.
• Fiyat bilgisi belirtilmişse para birimi ile birlikte işlenir (TL, USD, EUR).
• Gayrimenkul tipini doğru belirle: APARTMENT (daire), HOUSE (ev), VILLA, LAND (arsa), COMMERCIAL (ticari), OFFICE (ofis).
• Gayrimenkul detaylarını mümkün olduğunca eksiksiz doldur:
  • Metrekare (m²) bilgisi
  • Oda sayısı
  • Banyo sayısı
  • Kat bilgisi
  • Ek özellikler (bahçe, havuz, garaj, eşyalı olma durumu)
──────────────────────────────────────────────────────────────────────────────
1) GENEL KURALLAR
──────────────────────────────────────────────────────────────────────────────
• Mail *yeni bir alım/satım talebi* ise \`customerType\` alanını doğru doldur.  
• Eksik / çelişkili bilgi → \`isMissingInformation: true\`.  
• Yanıtlar nazik ve profesyonel olmalı.  
• E-posta içeriğini kullan fakat bilgileri \`property\` alanlarına  
  **doğrudan kopyalama**, önce anlamlandır.

\`type\` alanı →  
  BUYER_INQUIRY | SELLER_LISTING | PROPERTY_VIEWING_REQUEST | OTHER

──────────────────────────────────────────────────────────────────────────────
2) EMLAK BİLGİLERİ ÇIKARIMI
──────────────────────────────────────────────────────────────────────────────
• Alıcı talepleri için:
  • Aradığı gayrimenkul tipi
  • Tercih ettiği bölgeler
  • Bütçe aralığı
  • Özel istekler (kat, oda sayısı, bahçe vb.)
• Satıcı talepleri için:
  • Satılacak gayrimenkulün tipi
  • Tam konumu (şehir, ilçe, mahalle)
  • Fiyatı ve para birimi
  • Gayrimenkulün tüm özellikleri

──────────────────────────────────────────────────────────────────────────────
3) JSON ŞEMASI (boş değerler *null* olmalı)
──────────────────────────────────────────────────────────────────────────────
{
  "type": string,
  "from": string,
  "cc": string[] | null,
  "contentTitle": string,
  "contentHtml": string,

  "customer": {
    "name": string | null,
    "email": string | null,
    "gender": "MALE" | "FEMALE" | null,
    "customerType": "BUYER" | "SELLER" | "BOTH" | null
  },

  "language": "turkish" | "english",

  "property": {
    "propertyType": "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE" | null,
    "location": string | null,
    "city": string | null,
    "district": string | null,
    "neighborhood": string | null,
    "price": number | null,
    "currency": "TL" | "USD" | "EUR" | null,
    "size": number | null,
    "roomCount": number | null,
    "bathroomCount": number | null,
    "floor": number | null,
    "totalFloors": number | null,
    "hasGarage": boolean | null,
    "hasGarden": boolean | null,
    "hasPool": boolean | null,
    "isFurnished": boolean | null,
    "yearBuilt": number | null,
    "description": string | null,
    "features": string | null
  },

  "buyerPreferences": {
    "preferredLocations": string[] | null,
    "budgetMin": number | null,
    "budgetMax": number | null,
    "preferredPropertyTypes": string[] | null,
    "minRoomCount": number | null,
    "minSize": number | null,
    "mustHaveFeatures": string[] | null
  },

  "modelResponseTitle": string,
  "modelResponseMail": string,

  "isMissingInformation": boolean,

  "suggestedListings": {
    "listingIds": number[] | null
  }
}

──────────────────────────────────────────────────────────────────────────────
4) BÖLGE EŞLEŞTİRME
──────────────────────────────────────────────────────────────────────────────
• E-postada bahsedilen şehir, ilçe ve mahalle isimlerini doğru şekilde tespit et.
• Eğer bölge bilgisi belirsizse en yakın tahminini kullan.
• Şehir isimlerini tam olarak yaz (İstanbul, Ankara, İzmir, vb.).
• İlçe isimlerini tam olarak yaz (Kadıköy, Beşiktaş, Çankaya, vb.).

POPÜLER BÖLGELER (yaygın şehirler ve ilçeler):
${locationList.join('\n')}
`;
  return prompt.trim();
};
