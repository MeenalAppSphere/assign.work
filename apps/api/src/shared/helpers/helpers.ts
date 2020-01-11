import { ProjectWorkingDays } from '@aavantan-app/models';
import * as path from 'path';
import * as moment from 'moment';

import { DEFAULT_DECIMAL_PLACES, DEFAULT_INVITATION_EXPIRY } from './defaultValueConstant';

/**
 * converts given string to seconds
 * @param val ex: '1d 2h 34'
 * @return {number}
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

/**
 * seconds to string converter
 * @param seconds
 * @returns {string} ( 1h 2m )
 */
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

/**
 * convert hour to seconds
 * @param hour: number
 * @return {number}
 */
export const hourToSeconds = (hour: number = 0): number => {
  if (Number.isNaN(Number(hour))) {
    throw new TypeError('Expected a number');
  }
  return hour * 3600;
};

/**
 * convert seconds to hours
 * @param seconds: number
 * @return {number}
 */
export const secondsToHours = (seconds: number = 0): number => {
  if (Number.isNaN(Number(seconds))) {
    throw new TypeError('Expected a number');
  }
  return parseFloat((seconds / 3600).toFixed(DEFAULT_DECIMAL_PLACES));
};

/**
 * working days checker
 * checks if all days are in available in give days
 * @param days
 * return {boolean}
 */
export const validWorkingDaysChecker = (days: ProjectWorkingDays[] = []) => {
  const daysArray = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return days.length === 7 && daysArray.every(d => days.some(day => day.day === d));
};

/**
 * path resolver helper function
 * @param pathToResolve
 */
export const resolvePathHelper = (pathToResolve) => {
  return path.resolve(path.join(__dirname, pathToResolve));
};

/**
 * email address validator helper
 * @param emailId
 */
export const emailAddressValidator = (emailId): boolean => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailId);
};

/**
 * invitation link expire date checker
 * return tru if invitation expired
 * @param timestamp
 */
export const isInvitationExpired = (timestamp: number): boolean => {
  // check if given timestamp is lesser than expiry time
  return moment.utc(timestamp).isAfter(moment.utc(timestamp).add(DEFAULT_INVITATION_EXPIRY));
};
