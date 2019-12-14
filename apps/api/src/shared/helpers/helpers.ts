/**
 * converts given string to seconds
 * @param val
 * ex: '1d 2h 34'
 */
export const stringToSeconds = (val: string = ''): number => {
  // separate given string with space
  const separatedVal = val.trim().split(/\s/);

  // parse string to object like { d: 1, h: 2, m: 3 }
  const parsedObject = separatedVal.filter(value => value).reduce((acc, cur) => {
    // separate string and number from 1h 3m etc..
    const parsedStringAndNumber = cur.match(/[a-z]+|[^a-z]+/gi);

    if (parsedStringAndNumber) {
      acc[parsedStringAndNumber[1]] = Number(parsedStringAndNumber[0]);
    }
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
    // extra check for invalid string character like 1n 2u
    if (!converters[key]) {
      return second;
    }
    return second + converters[key](value);
  }, 0);
};


export const secondsToString = (seconds: number = 0): string => {
  if (typeof seconds !== 'number') {
    throw new TypeError('Expected a number');
  }

  const roundOff = seconds > 0 ? Math.floor : Math.ceil;

  const converters = {
    // d: value => roundOff(value / (3600 * 24)),
    h: value => roundOff(value / 3600),
    m: value => roundOff(value % 3600 / 60)
  };

  const readable = [];
  Object.entries(converters).forEach(([key, fn]) => {
    const convertedRes = fn(seconds);
    readable.push(convertedRes + key);
  });

  return readable.join(' ');
};
