import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePostCodeTableName1708937457165 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE post_code RENAME TO postcode`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE post_code RENAME TO post_code`);
    }

}
