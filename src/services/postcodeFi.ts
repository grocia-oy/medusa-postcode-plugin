import { TransactionBaseService, Logger } from '@medusajs/medusa';
import axios from 'axios';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';
import * as stream from 'stream';
import { promisify } from 'util';
import { PCFTableParseConfigFI, postcodeServiceConfig } from '../config';
import Zip from 'adm-zip';
import iconv from 'iconv-lite';
import readline from 'readline';
import { Postcode } from '../models/postcode';
import { Country } from '../models/country';
import CountryService from './country';
import { sliceArrayInChunks } from '../utils';

export interface PostcodeFiServiceParams {
  logger: Logger;
  countryService: CountryService;
}

type FileMeta = {
  url: string;
  fileName: string;
  fileNameNoExt: string;
  type: 'PCF' | 'POM' | string;
  date: string | number;
};

class PostcodeFiService extends TransactionBaseService {
  private readonly fetchingURL: string = 'https://www.posti.fi/webpcode/';
  private countryService: CountryService;

  logger: Logger;
  finished = promisify(stream.finished);
  downloadedFilesMeta: Record<string, FileMeta> = {};

  constructor(container: PostcodeFiServiceParams) {
    super(container);
    this.logger = container.logger;
    this.countryService = container.countryService;
  }

  async triggerUpdate() {
    const fileMetas = await this.syncFileMetadata();

    if (!existsSync(postcodeServiceConfig.cache.zipDir)) {
      mkdirSync(postcodeServiceConfig.cache.zipDir, { recursive: true });
    }

    if (!existsSync(postcodeServiceConfig.cache.extractedDir)) {
      mkdirSync(postcodeServiceConfig.cache.extractedDir, { recursive: true });
    }

    for (const fileMeta of fileMetas) {
      await this.downloadFile(fileMeta);
      await this.unzipFile(fileMeta);
      const convertedFilePath = await this.convertFile(fileMeta);

      if (fileMeta.type === 'PCF') {
        const country = await this.countryService.retrieveByCountryISO2('fi');
        const bulkPostCodeEntities = await this.createDBEntriesFromPCFFile(
          convertedFilePath,
          country
        );

        const entitiesInChunk = sliceArrayInChunks(bulkPostCodeEntities as any[], 50);

        await this.activeManager_.transaction(async (transactionEntityManager) => {
          for (const chunk of entitiesInChunk) {
            await transactionEntityManager
              .createQueryBuilder()
              .insert()
              .into(Postcode)
              .values(chunk)
              .orUpdate(
                [
                  'post_code',
                  'post_office_name',
                  'post_office_name_fi',
                  'post_office_name_se',
                  'post_office_abbr',
                  'post_office_abbr_fi',
                  'post_office_abbr_se',
                  'admin_region_code',
                  'admin_region_name',
                  'admin_region_name_fi',
                  'admin_region_name_se',
                  'municipality_code',
                  'municipality_name',
                  'municipality_name_fi',
                  'municipality_name_se',
                  'municipality_lang',
                  'entry_into_force_date',
                  'version_date',
                  'type',
                ],
                ['id'],
                {
                  skipUpdateIfNoValuesChanged: true,
                }
              )
              .execute();
          }
        });
      }
    }
  }

  private async syncFileMetadata(): Promise<FileMeta[]> {
    this.logger.info(`Syncing new postcode data from Posti (${this.fetchingURL})`);
    const response = await axios.get(this.fetchingURL);

    const urlMatches: string[] = response.data.match(
      /href="((.*)?webpcode\/(PCF)_([0-9]{8}).zip)"/g
    );
    if (!urlMatches || urlMatches.length === 0) {
      this.logger.error(
        'The url should be checked if the sources up-to-date with Posti service or there are any changes in service agreement'
      );
      throw new Error(`Cannot find the intended file on ${this.fetchingURL}`);
    }

    const filesMeta = urlMatches.map((url) => {
      const metaMatch = url.match(/href="((.*)?webpcode\/(((PCF)_([0-9]{8}))\.zip))"/);

      return {
        url: metaMatch[1],
        fileName: metaMatch[3],
        fileNameNoExt: metaMatch[4],
        type: metaMatch[5],
        date: metaMatch[6],
      };
    });

    return filesMeta;
  }

  private async downloadFile(fileMeta: FileMeta) {
    const outputPath = path.join(postcodeServiceConfig.cache.zipDir, fileMeta.fileName);
    const writerStream = createWriteStream(outputPath);

    this.logger.info(`Downloading file ${fileMeta.fileName} from Posti`);
    await axios
      .get(fileMeta.url, {
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          this.logger.info(
            `${fileMeta.fileNameNoExt}: Downloaded ${progressEvent.loaded}/${progressEvent.total}`
          );
        },
      })
      .then(async (response) => {
        response.data.pipe(writerStream);
        return this.finished(writerStream);
      });

    this.downloadedFilesMeta[fileMeta.fileName] = fileMeta;
  }

  private async unzipFile(fileMeta: FileMeta) {
    const zipPath = path.join(postcodeServiceConfig.cache.zipDir, fileMeta.fileName);

    if (!existsSync(zipPath) && this.downloadedFilesMeta[fileMeta.fileName]) {
      this.logger.error(`Cannot find ${zipPath}, skipping unzip this file`);
    }

    this.logger.info(
      `Extracting file ${fileMeta.fileName} from ${zipPath} to ${postcodeServiceConfig.cache.extractedDir}`
    );

    const zipFile = new Zip(zipPath);
    zipFile.extractAllTo(postcodeServiceConfig.cache.extractedDir, true);
  }

  private async convertFile(fileMeta: FileMeta) {
    const filePath = path.join(
      postcodeServiceConfig.cache.extractedDir,
      `${fileMeta.fileNameNoExt}.dat`
    );
    const convertedFilePath = path.join(
      postcodeServiceConfig.cache.extractedDir,
      `${fileMeta.fileNameNoExt}_utf8.dat`
    );
    if (!existsSync(filePath)) {
      this.logger.error(`Cannot find ${filePath}, skip converting this file`);
    }
    this.logger.info(`Converting file ${fileMeta.fileName} from ISO-8859-1 -> UTF-8`);
    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(convertedFilePath);

    return new Promise((resolve) => {
      readStream
        .pipe(iconv.decodeStream('latin1'))
        .pipe(iconv.encodeStream('utf8'))
        .pipe(writeStream)
        .on('close', () => {
          resolve(convertedFilePath);
        });
    });
  }

  private async createDBEntriesFromPCFFile(filePath, country: Country) {
    const entries = [];
    const lineReader = readline.createInterface({ input: createReadStream(filePath) });

    return new Promise((resolve) => {
      lineReader.on('line', (line) => {
        const parsedRow = this.parsePCFLine(line, country.id);
        entries.push(parsedRow);
      });

      lineReader.on('close', () => {
        this.logger.info('Parsing lines from data file completed');
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        this.logger.info(`The script uses approximately ${Math.round(used * 100) / 100} MB`);

        resolve(entries);
      });
    });
  }

  private parsePCFLine(line: string, country_id: number) {
    const row = {};

    const tableFields = Object.keys(PCFTableParseConfigFI);

    for (const fieldKey of tableFields) {
      const fieldConfig = PCFTableParseConfigFI[fieldKey];

      if (fieldConfig.start) {
        const substrStart = fieldConfig.start - 1;
        const substring = line
          .substring(fieldConfig.start - 1, substrStart + fieldConfig.length)
          .trim();
        if (fieldConfig.convertValue) {
          row[fieldKey] = fieldConfig.convertValue[substring];
        } else {
          row[fieldKey] = substring;
        }
      }
    }

    row['country_id'] = country_id;
    row['id'] = `fi_${row['post_code']}`;

    return row;
  }
}

export default PostcodeFiService;
