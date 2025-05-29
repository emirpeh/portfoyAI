const SL_KEYS = {
  loadCity: 'Naslov Nalaganja',
  loadCountry: 'Država Nalaganja',
  packagingType: 'Vrsta Pakiranja',
  numOfContainers: 'Število Kontejnerjev/Palet',
  containerType: 'Tip Kontejnerja/Palete',
  containerDimensions: 'Dimenzije Kontejnerja/Palete',
  goodsType: 'Vrsta Blaga',
  isStackable: 'Je Skladno (Da/Ne)',
  deliveryCity: 'Naslov Dostave',
  deliveryCountry: 'Država Dostave',
};

const parseKeyToSL = (key: string): string => {
  return SL_KEYS[key] || '';
};

export interface SlovenianRequestPriceTemplateProps {
  name: string;
  offerNo: string;
  details: object;
  deadline?: string;
}

export const createSlovenianRequestPriceTitleTemplate = (offerNo: string) => {
  return `Zahteva za Cenovno Ponudbo - ${offerNo}`;
};

export const createSlovenianRequestPriceTemplate = ({
  name,
  offerNo,
  details,
  deadline,
}: SlovenianRequestPriceTemplateProps) => {
  const detailsList = Object.entries(details)
    .map(([key, value]) => {
      const translation = parseKeyToSL(key);
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
    ? `Prosim, predložite svojo cenovno ponudbo do ${deadline}.`
    : 'Prosim, predložite svojo cenovno ponudbo čim prej.';

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Spoštovani ${name}</p>
    
    <p>Zahtevamo cenovno ponudbo za našo ponudbo številko ${offerNo}.</p>
    
    <p>Podrobnosti Ponudbe:</p>
    
    <div style="margin: 20px 0;">
      ${detailsList}
    </div>
    
    <p>${deadlineText}</p>
    
    <p>Lep pozdrav,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
