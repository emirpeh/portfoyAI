const MK_KEYS = {
  offerNo: 'Номер на Најава',
  loadDate: 'Датум на Товарење',
  loadAddress: 'Адреса на Товарење',
  packagingType: 'Вид на Пакување',
  numOfContainers: 'Број на Палети',
  containerType: 'Тип на Палета',
  containerDimensions: 'Димензии на Палета',
  goodsType: 'Вид на Стока',
  isStackable: 'Дали е Складирачко (Да/Не)',
  deliveryAddress: 'Адреса на Испорака (Поштенски Број)',
  croatian: 'Хрватски',
  slovenian: 'Словенечки',
  bosnian: 'Босански',
  turkish: 'Турски',
  english: 'Англиски',
};

const parseKeyToMK = (key: string): string => {
  return MK_KEYS[key] || '';
};

export interface MacedonianRequestInfoTemplateProps {
  name: string;
  questions: Array<string>;
}

export const createMacedonianRequestInfoTitleTemplate = (offerNo: string) => {
  return `Недоставени информации - ${offerNo}`;
};

export const createMacedonianRequestInfoTemplate = ({
  name,
  questions,
}: MacedonianRequestInfoTemplateProps) => {
  const questionsList = questions
    .map(q => {
      const translation = parseKeyToMK(q);
      if (q === 'isStackable') {
        return `<b>${translation}</b> (Да/Не)<br/>`;
      }
      return `<b>${translation}</b><br/>`;
    })
    .filter(translation => translation !== '')
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Почитувани ${name}</p>
    
    <p>Пред сè, ви благодариме за интересот кон нашата компанија.</p>
    
    <p>За да можеме да дадеме подобра понуда, ве молиме да одговорите на следните прашања:</p>
    
    <div style="margin: 20px 0;">
      ${questionsList}
    </div>
    
    <p>Со почит,</p>
    
    <p>Maxi Logistics</p>
  </div>
  `;
};
