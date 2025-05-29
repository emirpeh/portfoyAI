export interface TurkishLateSupplierOfferTemplateProps {
  baseUrl: string;
  offerNo: string;
  supplierEmail: string;
  supplierTitle: string;
  supplierContent: string;
  hours: number;
}

export const createTurkishLateSupplierOfferTitleTemplate = (
  offerNo: string,
  hours: number,
) => {
  return `Geç Tedarikçi Teklifi / Late Supplier Offer ${offerNo} - ${hours} Saat Geçti`;
};

export const createTurkishLateSupplierOfferTemplate = ({
  baseUrl,
  offerNo,
  hours,
  supplierEmail,
  supplierTitle,
  supplierContent,
}: TurkishLateSupplierOfferTemplateProps) => {
  return `
  Sayın Yetkilimiz,
  
  ${offerNo} numaralı teklif için ${hours} saat geçmiş olmasına rağmen tedarikçi tarafından teklif gelmiştir.
  
  Tedarikçi Bilgileri:
  - E-posta: ${supplierEmail}
  - Başlık: ${supplierTitle}
  
  Teklif İçeriği:
  ${supplierContent}
  
  Aşağıdaki link üzerinden teklif detaylarını kontrol edebilirsiniz.
  ${baseUrl}/offers?no=${offerNo}
  
  Saygılarımla,
  Milo
  `;
};
