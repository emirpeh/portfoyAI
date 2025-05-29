export interface TurkishMissingOfferNoFromSupplierTemplateProps {
  supplierMail: string;
  content: string;
}

export const createTurkishMissingOfferNoFromSupplierTitleTemplate = () => {
  return `Tedarikçi teklif numarası belirtmedi`;
};

export const createTurkishMissingOfferNoFromSupplierTemplate = ({
  supplierMail,
  content,
}: TurkishMissingOfferNoFromSupplierTemplateProps) => {
  return `
  Sayın Yetkilimiz,
  
  ${supplierMail} tedarikçimiz teklifiçin teklif numarasını belirtmedi. Aşağıda mailin detaylarını bulabilirsiniz.
  
  ${content}
  
  Saygılarımla,
  Milo
  `;
};
