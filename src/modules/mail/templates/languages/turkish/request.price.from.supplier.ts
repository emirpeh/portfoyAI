const TR_KEYS = {
  loadCity: 'Yükleme Şehri',
  loadCountry: 'Yükleme Ülkesi',
  packagingType: 'Ambalaj Şekli',
  numOfContainers: 'Kap/Palet Adedi',
  containerType: 'Kap/Palet Tipi',
  containerDimensions: 'Kap/Palet Ebatları',
  goodsType: 'Mal Cinsi',
  isStackable: 'İstiflenir mi (Evet/Hayır)',
  deliveryCity: 'Teslim Şehri',
  deliveryCountry: 'Teslim Ülkesi',
};

const parseKeyToTR = (key: string): string => {
  return TR_KEYS[key] || '';
};

export interface TurkishRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createTurkishRequestPriceTitleTemplate = (offerNo: string) => {
  return `Fiyat Teklifi Talebi - ${offerNo}`;
};

export const createTurkishRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: TurkishRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToTR(key);
      if (key === 'isStackable') {
        const formattedValue =
          value === true ? 'Evet' : value === false ? 'Hayır' : value;
        return translation
          ? `<p><strong>${translation}:</strong> ${formattedValue}</p>`
          : '';
      }
      return translation
        ? `<p><strong>${translation}:</strong> ${value}</p>`
        : '';
    })
    .join('');

  const deadlineText = deadline
    ? `Lütfen ${deadline} tarihine kadar fiyat teklifinizi sununuz.`
    : 'Lütfen en kısa sürede fiyat teklifinizi sununuz.';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Sayın ${name}</p>
    
    <p>${offerNo} numaralı teklifimiz için fiyat teklifi talep ediyoruz.</p>
    
    <p>Teklif Detayları:</p>
    
    <div style="margin: 20px 0;">
      ${detailsList}
    </div>
    
    <p>${deadlineText}</p>
    
    <p>Saygılarımızla,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
