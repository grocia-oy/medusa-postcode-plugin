import path from 'path';
import os from 'os';
import { PostcodeTypes } from '../types';

const baseDir = path.resolve(`${os.homedir()}/.postcode`);
const zipDir = path.resolve(`${baseDir}/zip`);
const extractedDir = path.resolve(`${baseDir}/extracted`);
export const postcodeServiceConfig = {
  cache: {
    baseDir,
    zipDir,
    extractedDir,
  },
};

export const PCFTableParseConfigFI = {
  record_identifier: {
    start: 1,
    length: 5,
  },
  post_code: {
    start: 14,
    length: 5,
  },
  post_office_name: { start: 19, length: 30 },
  post_office_name_fi: { start: 19, length: 30 },
  post_office_name_se: { start: 49, length: 30 },
  post_office_abbr: {
    start: 79,
    length: 12,
  },
  post_office_abbr_fi: {
    start: 79,
    length: 12,
  },
  post_office_abbr_se: {
    start: 91,
    length: 12,
  },
  version_date: {
    start: 6,
    length: 8,
  },
  entry_into_force_date: {
    start: 103,
    length: 8,
  },
  admin_region_code: {
    start: 112,
    length: 5,
  },
  admin_region: {
    start: 112,
    length: 5,
  },
  admin_region_name: {
    start: 117,
    length: 30,
  },
  admin_region_name_fi: {
    start: 117,
    length: 30,
  },
  admin_region_name_se: {
    start: 147,
    length: 30,
  },
  municipality_code: {
    start: 177,
    length: 3,
  },
  municipality_name: {
    start: 180,
    length: 20,
  },
  municipality_name_fi: {
    start: 180,
    length: 20,
  },
  municipality_name_se: {
    start: 200,
    length: 20,
  },
  municipality_lang: {
    start: 220,
    length: 1,
    convertValue: {
      '1': ['fi'],
      '2': ['fi', 'se'],
      '3': ['fi', 'se'],
      '4': ['se'],
    },
  },
  type: {
    start: 111,
    length: 1,
    convertValue: {
      '1': PostcodeTypes.NORMAL,
      '2': PostcodeTypes.PO_BOX,
      '3': PostcodeTypes.CORPORATE,
      '4': PostcodeTypes.COMPILATION,
      '5': PostcodeTypes.REPLY_MAIL,
      '6': PostcodeTypes.PARCEL_MACHINE,
      '7': PostcodeTypes.PICKUP_POINT,
      '8': PostcodeTypes.TECHNICAL,
    },
  },
};
