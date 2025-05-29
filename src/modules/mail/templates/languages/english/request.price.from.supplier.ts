const EN_KEYS = {
  loadCity: 'Loading City',
  loadCountry: 'Loading Country',
  packagingType: 'Packaging Type',
  numOfContainers: 'Number of Containers/Pallets',
  containerType: 'Container/Pallet Type',
  containerDimensions: 'Container/Pallet Dimensions',
  goodsType: 'Type of Goods',
  isStackable: 'Is Stackable (Yes/No)',
  deliveryCity: 'Delivery City',
  deliveryCountry: 'Delivery Country',
};

const parseKeyToEN = (key: string): string => {
  return EN_KEYS[key] || '';
};

export interface EnglishRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createEnglishRequestPriceTitleTemplate = (offerNo: string) => {
  return `Price Quote Request - ${offerNo}`;
};

export const createEnglishRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: EnglishRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToEN(key);
      if (key === 'isStackable') {
        const formattedValue = value === true ? 'Yes' : value === false ? 'No' : value;
        return translation ? `<p><strong>${translation}:</strong> ${formattedValue}</p>` : '';
      }
      return translation ? `<p><strong>${translation}:</strong> ${value}</p>` : '';
    })
    .join('');

  const deadlineText = deadline
    ? `Please submit your price quotation by ${deadline}.`
    : 'Please submit your price quotation as soon as possible.';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Dear ${name}</p>
    
    <p>We are requesting a price quotation for our offer number ${offerNo}.</p>
    
    <p>Offer Details:</p>
    
    <div style="margin: 20px 0;">
      ${detailsList}
    </div>
    
    <p>${deadlineText}</p>
    
    <p>Best regards,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
