const TR_KEYS = {
  loadDate: 'Yükleme Tarihi',
  loadCountry: 'Yükleme Ülkesi',
  loadCity: 'Yükleme Şehri',
  loadAddress: 'Yükleme Adresi',
  packagingType: 'Ambalaj Şekli',
  numOfContainers: 'Kap/Palet Adedi',
  containerType: 'Kap/Palet Tipi',
  containerDimensions: 'Kap/Palet Ebatları',
  goodsType: 'Mal Cinsi',
  isStackable: 'İstiflenir mi',
  deliveryCountry: 'Teslimat Ülkesi',
  deliveryCity: 'Teslimat Şehri',
};

const parseKeyToTR = (key: string): string => {
  return TR_KEYS[key] || '';
};

export interface TurkishNoSupplierInfoTemplateProps {
  baseUrl: string;
  offerNo: string;
  customerMail: string;
  questions: object;
}

export const createTurkishNoSupplierInfoTitleTemplate = (offerNo: string) => {
  return `Üzgünüz, Uygun Tedarikçi Bulamadık - ${offerNo}`;
};

export const createTurkishNoSupplierInfoTemplate = ({
  baseUrl,
  offerNo,
  customerMail,
  questions,
}: TurkishNoSupplierInfoTemplateProps) => {
  const questionsList = Object.entries(questions)
    .map(([key, value]) => {
      const translation = parseKeyToTR(key);
      if (!translation) return '';
      
      if (key === 'isStackable') {
        const formattedValue = value === true ? 'Evet' : value === false ? 'Hayır' : value;
        return `<p><strong>${translation}:</strong> ${formattedValue}</p>`;
      }
      
      if (key === 'loadDate' && value instanceof Date) {
        const formattedDate = value.toLocaleString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `<p><strong>${translation}:</strong> ${formattedDate}</p>`;
      }
      
      return `<p><strong>${translation}:</strong> ${value}</p>`;
    })
    .filter(Boolean)
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Sayın Yetkilimiz,</p>
    
    <p>Teklif için ${customerMail} müşterimizden aşağıdaki bilgileri aldık ancak uygun tedarikçi bulamadık.</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>

    <p>Aşağıdaki link üzerinden teklif detaylarını kontrol edebilirsiniz.</p>
    <p><a href="${baseUrl}/offers?no=${offerNo}" style="color: #0066cc;">${baseUrl}/offers?no=${offerNo}</a></p>
    
    <p>Saygılarımla,<br/>Milo</p>
  </div>
  `;
};
