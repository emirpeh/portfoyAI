const EN_KEYS = {
  offerNo: 'Offer No',
  loadDate: 'Loading Date',
  loadAddress: 'Loading Address',
  packagingType: 'Packaging Type',
  numOfContainers: 'Number of Pallets',
  containerType: 'Pallet Type',
  containerDimensions: 'Pallet Dimensions',
  goodsType: 'Type of Goods',
  isStackable: 'Is Stackable (Yes/No)',
  deliveryAddress: 'Delivery Address (Postal Code)',
  croatian: 'Croatian',
  slovenian: 'Slovenian',
};

const parseKeyToEN = (key: string): string => {
  return EN_KEYS[key] || '';
};

export interface EnglishRequestInfoTemplateProps {
  name: string;
  questions: Array<string>;
}

export const createEnglishRequestInfoTitleTemplate = (offerNo: string) => {
  return `Missing Information - ${offerNo}`;
};

export const createEnglishRequestInfoTemplate = ({
  name,
  questions,
}: EnglishRequestInfoTemplateProps) => {
  const questionsList = questions
    .map(q => {
      const translation = parseKeyToEN(q);
      if (q === 'isStackable') {
        return `<b>${translation}</b> (Yes/No)<br/>`;
      }
      return `<b>${translation}</b><br/>`;
    })
    .filter(translation => translation !== '')
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Hello ${name}</p>
    
    <p>First of all, thank you for your interest in our company.</p>
    
    <p>In order to make a healthier pricing, we kindly ask you to answer the question(s) below.</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>
    
    <p>Best regards,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
