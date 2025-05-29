const TR_KEYS = {
  offerNo: 'Teklif No',
  loadCity: 'Yükleme Adresi',
  packagingType: 'Ambalaj Şekli',
  numOfContainers: 'Kap/Palet Adedi',
  containerType: 'Kap/Palet Tipi',
  containerDimensions: 'Kap/Palet Ebatları',
  goodsType: 'Mal Cinsi',
  isStackable: 'İstiflenir mi (Evet/Hayır)',
  deliveryDate: 'Teslim Tarihi',
  deliveryCity: 'Teslim Adresi',
};

const parseKeyToTR = (key: string): string => {
  return TR_KEYS[key] || '';
};

export interface TurkishRequestInfoTemplateProps {
  name: string;
  questions: Array<string>;
}

export interface TurkishRequestInfoTemplate {
  template: string;
  title: string;
  questionsList: string;
}

export const createTurkishRequestInfoTitleTemplate = (offerNo: string) => {
  return `Eksik Bilgiler Hk. - ${offerNo}`;
};

export const createTurkishRequestInfoTemplate = ({
  name,
  questions,
}: TurkishRequestInfoTemplateProps) => {
  const questionsList = questions
    .map(q => {
      const translation = parseKeyToTR(q);
      if (q === 'isStackable') {
        return `<b>${translation}</b> (Evet/Hayır)<br/>`;
      }
      return `<b>${translation}</b><br/>`;
    })
    .filter(translation => translation !== '')
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Merhaba ${name}</p>
    
    <p>Öncelikle şirketimize göstermiş olduğunuz ilgi için teşekkür ederiz.</p>
    
    <p>Daha sağlık bir fiyatlandırma yapabilmemiz için aşağıda ki soru(ları) cevaplamanızı rica ederiz.</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>
    
    <p>Saygılarımızla,</p>
    
    <p>Maxi Logistik</p>
  </div>
  `;
};
