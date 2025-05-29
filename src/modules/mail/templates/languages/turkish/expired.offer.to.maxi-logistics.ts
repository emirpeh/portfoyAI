export interface TurkishExpiredOfferTemplateProps {
  baseUrl: string;
  offerNo: string;
}

export const createTurkishExpiredOfferTitleTemplate = (offerNo: string) => {
  return `24 Saat Geçti - Teklif Düzeltme - ${offerNo}`;
};

export const createTurkishExpiredOfferTemplate = ({
  baseUrl,
  offerNo,
}: TurkishExpiredOfferTemplateProps) => {
  return `
  Sayın Yetkilimiz,
  
  ${offerNo} numaralı teklif için 24 saat geçmiş olmasına rağmen müşteri tarafından düzeltme talebi gelmiştir.
  
  Aşağıdaki link üzerinden teklif detaylarını kontrol edebilirsiniz.
  ${baseUrl}/offers?no=${offerNo}
  
  Saygılarımla,
  Milo
  `;
};
