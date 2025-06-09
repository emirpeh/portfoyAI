const BS_KEYS = {
  loadCity: 'Grad Utovara',
  loadCountry: 'Država Utovara',
  packagingType: 'Vrsta Pakovanja',
  numOfContainers: 'Broj Kontejnera/Paleta',
  containerType: 'Tip Kontejnera/Palete',
  containerDimensions: 'Dimenzije Kontejnera/Palete',
  goodsType: 'Vrsta Robe',
  isStackable: 'Da Li Je Skladno (Da/Ne)',
  deliveryCity: 'Grad Dostave',
  deliveryCountry: 'Država Dostave',
};

const parseKeyToBS = (key: string): string => {
  return BS_KEYS[key] || '';
};

export interface BosnianRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createBosnianRequestPriceTitleTemplate = (offerNo: string) => {
  return `Zahtjev za Ponudu Cijene - ${offerNo}`;
};

export const createBosnianRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: BosnianRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToBS(key);
      if (key === 'isStackable') {
        const formattedValue =
          value === true ? 'Da' : value === false ? 'Ne' : value;
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
