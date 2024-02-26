import { BaseEntity, generateEntityId } from '@medusajs/medusa';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PostcodeTypes } from '../types';
import { Country } from './country';

@Entity()
export class Postcode extends BaseEntity {
  @Column({ type: 'varchar' })
  record_identifier: string;

  @Column({ type: 'varchar' })
  post_code: string;

  @Column({ type: 'varchar' })
  post_office_name: string;

  @Column({ type: 'varchar', nullable: true })
  post_office_name_fi: string;

  @Column({ type: 'varchar', nullable: true })
  post_office_name_se: string;

  @Column({ type: 'varchar', nullable: true })
  post_office_abbr: string;

  @Column({ type: 'varchar', nullable: true })
  post_office_abbr_fi: string;

  @Column({ type: 'varchar', nullable: true })
  post_office_abbr_se: string;

  @Column({ type: 'varchar' })
  admin_region_code: string;

  @Column({ type: 'varchar' })
  admin_region_name: string;

  @Column({ type: 'varchar' })
  admin_region_name_fi: string;

  @Column({ type: 'varchar' })
  admin_region_name_se: string;

  @Column({ type: 'varchar' })
  municipality_code: string;

  @Column({ type: 'varchar' })
  municipality_name: string;

  @Column({ type: 'varchar' })
  municipality_name_fi: string;

  @Column({ type: 'varchar' })
  municipality_name_se: string;

  @Column({ type: 'text', array: true })
  municipality_lang: string[];

  @Column({ type: 'date' })
  entry_into_force_date: Date;

  @Column({ type: 'date' })
  version_date: Date;

  @Column({ type: 'enum', enum: PostcodeTypes })
  type: PostcodeTypes;

  @Column({ type: 'integer' })
  country_id: number;

  @ManyToOne(() => Country, (country) => country.post_codes)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, 'postcode');
  }
}
