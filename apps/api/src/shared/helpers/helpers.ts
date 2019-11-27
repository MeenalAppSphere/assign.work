/**
 * converts given string to seconds
 * @param val
 * ex: '1d 2h 34'
 */
export const stringToSeconds = (val: string): number => {
  // separate given string with space
  const separatedVal = val.split(/\s/);

  // parse string to object like { d: 1, h: 2, m: 3 }
  const parsedObject = separatedVal.reduce((acc, cur) => {
    const parsedStringAndNumber = cur.match(/[a-z]+|[^a-z]+/gi);
    acc[parsedStringAndNumber[1]] = Number(parsedStringAndNumber[0]);
    return acc;
  }, {});

  // converters functions
  const converters = {
    d: value => value * 86400,
    h: value => value * 3600,
    m: value => value * 60
  };

  // convert to second
  return Object.entries(parsedObject).reduce((second, [key, value]) => {
    return second + converters[key](value);
  }, 0);
};


export const secondsToString = (seconds: number): string => {
  if (typeof seconds !== 'number') {
    throw new TypeError('Expected a number');
  }

  const roundOff = seconds > 0 ? Math.floor : Math.ceil;

  const converters = {
    d: value => roundOff(value / (3600 * 24)),
    h: value => roundOff(value % (3600 * 24) / 3600),
    m: value => roundOff(value % 3600 / 60)
  };

  Object.entries(converters).reduce((readable, [key, fn]) => {
    const convertedRes = fn(seconds);
    return readable + ' ' + (convertedRes > 0 ? convertedRes + key : '');
  }, '');

  return '';
};
