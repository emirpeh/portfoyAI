const BS_KEYS = {
  offerNo: 'Broj Ponude',
  loadDate: 'Datum Utovara',
  loadAddress: 'Adresa Utovara',
  packagingType: 'Vrsta Pakiranja',
  numOfContainers: 'Broj Paleta',
  containerType: 'Tip Palete',
  containerDimensions: 'Dimenzije Palete',
  goodsType: 'Vrsta Robe',
  isStackable: 'Može Li Se Slagati (Da/Ne)',
  deliveryAddress: 'Adresa Dostave (Poštanski Broj)',
};

const parseKeyToBS = (key: string): string => {
  return BS_KEYS[key] || '';
};

export const createBosnianRequestInfoTitleTemplate = (offerNo: string) => {
  return `Nedostaju informacije - ${offerNo}`;
};

export interface BosnianRequestInfoTemplateProps {
  name: string;
  questions: Array<string>;
}

export const createBosnianRequestInfoTemplate = ({
  name,
  questions,
}: BosnianRequestInfoTemplateProps) => {
  const questionsList = questions
    .map(q => {
      const translation = parseKeyToBS(q);
      if (q === 'isStackable') {
        return `<b>${translation}</b> (Da/Ne)<br/>`;
      }
      return `<b>${translation}</b><br/>`;
    })
    .filter(translation => translation !== '')
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Poštovani ${name}</p>
    
    <p>Prije svega, hvala vam na interesu za našu kompaniju.</p>
    
    <p>Kako bismo mogli dati bolju ponudu, molimo vas da odgovorite na sljedeća pitanja:</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>
    
    <p>Srdačan pozdrav,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
