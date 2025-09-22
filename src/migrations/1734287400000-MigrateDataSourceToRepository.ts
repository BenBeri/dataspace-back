import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateDataSourceToRepository1734287400000
  implements MigrationInterface
{
  name = 'MigrateDataSourceToRepository1734287400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns to repositories table
    await queryRunner.query(`
      ALTER TABLE "repositories" 
      ADD COLUMN "connectionName" character varying,
      ADD COLUMN "encryptedConnectionConfiguration" text
    `);

    // Step 2: Create new repository_connection_history table
    await queryRunner.query(`
      CREATE TABLE "repository_connection_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "repositoryId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "previousConnectionName" character varying,
        "newConnectionName" character varying,
        "previousType" character varying,
        "newType" character varying,
        "configurationChanged" boolean,
        "changeDescription" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repository_connection_history" PRIMARY KEY ("id")
      )
    `);

    // Step 3: Add foreign key constraints for repository_connection_history
    await queryRunner.query(`
      ALTER TABLE "repository_connection_history" 
      ADD CONSTRAINT "FK_repository_connection_history_repository" 
      FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "repository_connection_history" 
      ADD CONSTRAINT "FK_repository_connection_history_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Step 4: Migrate data from data_sources to repositories
    // Note: This assumes each repository has at most one data source
    await queryRunner.query(`
      UPDATE "repositories" 
      SET 
        "connectionName" = ds.name,
        "encryptedConnectionConfiguration" = ds."encryptedConfiguration"
      FROM "data_sources" ds 
      WHERE "repositories".id = ds."repositoryId"
    `);

    // Step 5: Migrate data from data_source_change_history to repository_connection_history
    await queryRunner.query(`
      INSERT INTO "repository_connection_history" (
        "repositoryId", 
        "userId", 
        "previousConnectionName", 
        "newConnectionName", 
        "previousType", 
        "newType", 
        "configurationChanged", 
        "changeDescription", 
        "createdAt"
      )
      SELECT 
        ds."repositoryId",
        dsch."userId",
        dsch."previousName",
        dsch."newName", 
        dsch."previousType",
        dsch."newType",
        dsch."configurationChanged",
        dsch."changeDescription",
        dsch."createdAt"
      FROM "data_source_change_history" dsch
      JOIN "data_sources" ds ON dsch."dataSourceId" = ds.id
    `);

    // Step 6: Drop old tables (in reverse dependency order)
    await queryRunner.query(`DROP TABLE "data_source_change_history"`);
    await queryRunner.query(`DROP TABLE "data_sources"`);

    // Step 7: Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_repository_connection_history_repository" 
      ON "repository_connection_history" ("repositoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_repository_connection_history_user" 
      ON "repository_connection_history" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration - recreate data_sources and data_source_change_history tables

    // Step 1: Recreate data_sources table
    await queryRunner.query(`
      CREATE TABLE "data_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "encryptedConfiguration" text NOT NULL,
        "repositoryId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_sources" PRIMARY KEY ("id")
      )
    `);

    // Step 2: Recreate data_source_change_history table
    await queryRunner.query(`
      CREATE TABLE "data_source_change_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dataSourceId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "previousName" character varying,
        "newName" character varying,
        "previousType" character varying,
        "newType" character varying,
        "configurationChanged" boolean,
        "changeDescription" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_data_source_change_history" PRIMARY KEY ("id")
      )
    `);

    // Step 3: Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "data_sources" 
      ADD CONSTRAINT "FK_data_sources_repository" 
      FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "data_source_change_history" 
      ADD CONSTRAINT "FK_data_source_change_history_data_source" 
      FOREIGN KEY ("dataSourceId") REFERENCES "data_sources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "data_source_change_history" 
      ADD CONSTRAINT "FK_data_source_change_history_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Step 4: Migrate data back from repositories to data_sources
    await queryRunner.query(`
      INSERT INTO "data_sources" (id, name, "encryptedConfiguration", "repositoryId", "createdAt", "updatedAt")
      SELECT 
        uuid_generate_v4(),
        COALESCE("connectionName", 'Default Connection'),
        COALESCE("encryptedConnectionConfiguration", '{}'),
        id,
        "createdAt",
        "updatedAt"
      FROM "repositories" 
      WHERE "connectionName" IS NOT NULL OR "encryptedConnectionConfiguration" IS NOT NULL
    `);

    // Step 5: Migrate data back from repository_connection_history to data_source_change_history
    await queryRunner.query(`
      INSERT INTO "data_source_change_history" (
        "dataSourceId", 
        "userId", 
        "previousName", 
        "newName", 
        "previousType", 
        "newType", 
        "configurationChanged", 
        "changeDescription", 
        "createdAt"
      )
      SELECT 
        ds.id,
        rch."userId",
        rch."previousConnectionName",
        rch."newConnectionName",
        rch."previousType",
        rch."newType", 
        rch."configurationChanged",
        rch."changeDescription",
        rch."createdAt"
      FROM "repository_connection_history" rch
      JOIN "data_sources" ds ON rch."repositoryId" = ds."repositoryId"
    `);

    // Step 6: Drop new tables and columns
    await queryRunner.query(`DROP TABLE "repository_connection_history"`);

    await queryRunner.query(`
      ALTER TABLE "repositories" 
      DROP COLUMN "connectionName",
      DROP COLUMN "encryptedConnectionConfiguration"
    `);
  }
}
