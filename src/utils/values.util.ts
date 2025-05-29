const getEmptyValues = (data: object) => {
  return Object.entries(data)
    .filter(
      ([key, value]) =>
        (value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim() === '')) &&
        !(
          key === 'deletedAt' ||
          key === 'createdAt' ||
          key === 'updatedAt' ||
          key === 'id' ||
          key === 'offerNo' ||
          key === 'status' ||
          key === 'foreignTrade'
        ),
    )
    .map(([key]) => key);
};

const getNonEmptyValues = (data: object) => {
  return Object.entries(data)
    .filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(
          key === 'deletedAt' ||
          key === 'createdAt' ||
          key === 'updatedAt' ||
          key === 'id' ||
          key === 'offerNo' ||
          key === 'status' ||
          key === 'foreignTrade'
        ),
    )
    .map(([key]) => key);
};

const getNonEmptyObject = (data: object) => {
  return Object.entries(data)
    .filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        !(
          key === 'deletedAt' ||
          key === 'createdAt' ||
          key === 'updatedAt' ||
          key === 'id' ||
          key === 'offerNo' ||
          key === 'status' ||
          key === 'foreignTrade'
        ),
    )
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

export { getEmptyValues, getNonEmptyValues, getNonEmptyObject };
