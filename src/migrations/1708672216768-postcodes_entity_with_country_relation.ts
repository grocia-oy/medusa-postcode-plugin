import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostcodesEntityWithCountryRelation1708672216768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_code_types') THEN
                CREATE TYPE "post_code_types" AS ENUM (
                    'normal',
                    'po_box',
                    'corporate',
                    'compilation',
                    'reply_mail',
                    'parcel_machine',
                    'pickup_point',
                    'technical'
                );
            END IF;
        END
        $$;
    `);
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "post_code" (
            "id" character varying NOT NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "record_identifier" character varying NOT NULL,
            "post_code" character varying NOT NULL,
            "post_office_name" character varying NOT NULL,
            "post_office_name_fi" character varying,
            "post_office_name_se" character varying,
            "post_office_abbr" character varying,
            "post_office_abbr_fi" character varying,
            "post_office_abbr_se" character varying,
            "admin_region_code" character varying NOT NULL,
            "admin_region_name" character varying NOT NULL,
            "admin_region_name_fi" character varying NOT NULL,
            "admin_region_name_se" character varying NOT NULL,
            "municipality_code" character varying NOT NULL,
            "municipality_name" character varying NOT NULL,
            "municipality_name_fi" character varying NOT NULL,
            "municipality_name_se" character varying NOT NULL,
            "municipality_lang" TEXT[] NOT NULL,
            "entry_into_force_date" DATE NOT NULL,
            "version_date" DATE NOT NULL,
            "type" "post_code_types" NOT NULL,
            "country_id" integer NOT NULL,
            CONSTRAINT "PK_be5fda3aac270b134ff9c01cdea" PRIMARY KEY ("id")
        );
    `);
    await queryRunner.query(
      `ALTER TABLE "post_code" ADD CONSTRAINT "FK_y9zkdxvtmumxk1gl3ehonq" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_code" DROP CONSTRAINT "FK_y9zkdxvtmumxk1gl3ehonq"`);
    await queryRunner.query(`DROP TABLE "post_code"`);
  }
}
