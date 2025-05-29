const HR_KEYS = {
  loadCity: 'Grad Utovara',
  loadCountry: 'Država Utovara',
  packagingType: 'Vrsta Pakiranja',
  numOfContainers: 'Broj Kontejnera/Paleta',
  containerType: 'Tip Kontejnera/Palete',
  containerDimensions: 'Dimenzije Kontejnera/Palete',
  goodsType: 'Vrsta Robe',
  isStackable: 'Je Li Skladno (Da/Ne)',
  deliveryCity: 'Grad Dostave',
  deliveryCountry: 'Država Dostave',
};

const parseKeyToHR = (key: string): string => {
  return HR_KEYS[key] || '';
};

export interface CroatianRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createCroatianRequestPriceTitleTemplate = (offerNo: string) => {
  return `Zahtjev za Ponudu Cijene - ${offerNo}`;
};

export const createCroatianRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: CroatianRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToHR(key);
      if (key === 'isStackable') {
        const formattedValue = value === true ? 'Da' : value === false ? 'Ne' : value;
        return translation ? `<p><strong>${translation}:</strong> ${formattedValue}</p>` : '';
      }
      return translation ? `<p><strong>${translation}:</strong> ${value}</p>` : '';
    })
    .join('');

  const deadlineText = deadline
    ? `Molimo dostavite svoju ponudu cijene do ${deadline}.`
    : 'Molimo dostavite svoju ponudu cijene što prije.';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Poštovani ${name}</p>
    
    <p>Tražimo ponudu cijene za našu ponudu broj ${offerNo}.</p>
    
    <p>Detalji Ponude:</p>
    
    <div style="margin: 20px 0;">
      ${detailsList}
    </div>
    
    <p>${deadlineText}</p>
    
    <p>S poštovanjem,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
