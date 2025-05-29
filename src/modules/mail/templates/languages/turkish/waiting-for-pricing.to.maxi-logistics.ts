export interface WaitingForPricingTemplateProps {
  baseUrl: string;
  offerNo: string;
  offerExpiryHours: number;
}

export const createWaitingForPricingTitleTemplate = (offerNo: string) => {
  return `Teklif Sağlanması Bekleniyor - ${offerNo}`;
};

export const createWaitingForPricingTemplate = ({
  baseUrl,
  offerNo,
  offerExpiryHours,
}: WaitingForPricingTemplateProps) => {
  return `
  Sayın Yetkilimiz,
  
  ${offerNo} numaralı müşteri isteri için tekliflerinizin tamamlanması beklenmektedir.
  
  Aşağıdaki link üzerinden teklifinizin tamamlanmasını sağlayabilirsiniz. Teklfinizi ${offerExpiryHours} süre içerisinde vermemiz halinde sistem tarafından otomatik olarak teklifinizin tamamlanması sağlanacaktır.

  ${baseUrl}/offers?no=${offerNo}
  
  Saygılarımla,
  Milo
  `;
};
