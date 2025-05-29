const SL_KEYS = {
  offerNo: 'Številka Naročila',
  loadDate: 'Datum Nalaganja',
  loadAddress: 'Naslov Nalaganja',
  packagingType: 'Vrsta Pakiranja',
  numOfContainers: 'Število Palet',
  containerType: 'Tip Palete',
  containerDimensions: 'Dimenzije Palete',
  goodsType: 'Vrsta Blaga',
  isStackable: 'Ali Je Skladljivo',
  deliveryAddress: 'Naslov Dostave (Poštna Številka)',
};

const parseKeyToSL = (key: string): string => {
  return SL_KEYS[key] || '';
};

export interface SlovenianRequestInfoTemplateProps {
  name: string;
  questions: Array<string>;
}

export const createSlovenianRequestInfoTitleTemplate = (offerNo: string) => {
  return `Eksik informacije - ${offerNo}`;
};

export const createSlovenianRequestInfoTemplate = ({
  name,
  questions,
}: SlovenianRequestInfoTemplateProps) => {
  const questionsList = questions
    .map(q => parseKeyToSL(q))
    .filter(translation => translation !== '')
    .map(translation => `<b>${translation}</b> <br/>`)
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Spoštovani ${name}</p>
    
    <p>Najprej se vam zahvaljujemo za zanimanje za naše podjetje.</p>
    
    <p>Za boljše cenovno ponudbo vas prosimo, da odgovorite na naslednja vprašanja:</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>
    
    <p>Lep pozdrav,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
