const MK_KEYS = {
  loadCity: 'Град на Товарење',
  loadCountry: 'Држава на Товарење',
  packagingType: 'Вид на Пакување',
  numOfContainers: 'Број на Контејнери/Палети',
  containerType: 'Тип на Контејнер/Палета',
  containerDimensions: 'Димензии на Контејнер/Палета',
  goodsType: 'Вид на Стока',
  isStackable: 'Дали е Складирачко (Да/Не)',
  deliveryCity: 'Град на Испорака',
  deliveryCountry: 'Држава на Испорака',
};

const parseKeyToMK = (key: string): string => {
  return MK_KEYS[key] || '';
};

export interface MacedonianRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createMacedonianRequestPriceTitleTemplate = (offerNo: string) => {
  return `Барање за Понуда за Цена - ${offerNo}`;
};

export const createMacedonianRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: MacedonianRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToMK(key);
      return translation
        ? `<p><strong>${translation}:</strong> ${value}</p>`
        : '';
    })
    .join('');

  const deadlineText = deadline
    ? `Ве молиме доставете ја вашата понуда за цена до ${deadline}.`
    : 'Ве молиме доставете ја вашата понуда за цена во најкраток можен рок.';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Почитувани ${name}</p>
    
    <p>Бараме понуда за цена за нашата понуда број ${offerNo}.</p>
    
    <p>Детали за Понудата:</p>
    
    <div style="margin: 20px 0;">
      ${detailsList}
    </div>
    
    <p>${deadlineText}</p>
    
    <p>Со почит,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
