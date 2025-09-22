import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRepositoryMultiCredentialsSupport1734350000000
  implements MigrationInterface
{
  name = 'AddRepositoryMultiCredentialsSupport1734350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create repository_credentials table
    await queryRunner.query(`
      CREATE TABLE "repository_credentials" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "repositoryId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "encryptedCredentials" text NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_repository_credentials_repositoryId_name" UNIQUE ("repositoryId", "name")
      )
    `);

    // 2. Create credentials_access table
    await queryRunner.query(`
      CREATE TABLE "credentials_access" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "credentialsId" uuid NOT NULL,
        "identityType" varchar NOT NULL CHECK ("identityType" IN ('user', 'group', 'default')),
        "identityId" varchar NOT NULL,
        "grantedBy" uuid,
        "notes" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_credentials_access_credentialsId_identityType_identityId" UNIQUE ("credentialsId", "identityType", "identityId")
      )
    `);

    // 3. Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "repository_credentials" 
      ADD CONSTRAINT "FK_repository_credentials_repositoryId" 
      FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "credentials_access" 
      ADD CONSTRAINT "FK_credentials_access_credentialsId" 
      FOREIGN KEY ("credentialsId") REFERENCES "repository_credentials"("id") ON DELETE CASCADE
    `);

    // 4. Create indices for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_repository_credentials_repositoryId" ON "repository_credentials" ("repositoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_repository_credentials_isDefault" ON "repository_credentials" ("repositoryId", "isDefault") 
      WHERE "isDefault" = true AND "isActive" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_credentials_access_credentialsId" ON "credentials_access" ("credentialsId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_credentials_access_identity" ON "credentials_access" ("identityType", "identityId")
    `);

    // 5. Migrate existing repository data
    // Get all repositories that have connection configurations
    const repositories = await queryRunner.query(`
      SELECT id, "connectionName", "encryptedConnectionConfiguration"
      FROM repositories 
      WHERE "encryptedConnectionConfiguration" IS NOT NULL
    `);

    // For each repository with existing credentials, create a default credentials entry
    for (const repo of repositories) {
      const connectionName = repo.connectionName || 'Default Connection';

      // Insert into repository_credentials
      const credentialsResult = await queryRunner.query(
        `
        INSERT INTO "repository_credentials" 
        ("repositoryId", "name", "description", "encryptedCredentials", "isDefault", "isActive")
        VALUES ($1, $2, $3, $4, true, true)
        RETURNING "id"
      `,
        [
          repo.id,
          connectionName,
          'Migrated from legacy single-credential system',
          repo.encryptedConnectionConfiguration,
        ],
      );

      const credentialsId = credentialsResult[0].id;

      // Create default access entry for these credentials
      await queryRunner.query(
        `
        INSERT INTO "credentials_access" 
        ("credentialsId", "identityType", "identityId", "notes")
        VALUES ($1, 'default', 'default', 'Default access for all repository users - migrated from legacy system')
      `,
        [credentialsId],
      );
    }

    console.log(
      `Migration completed: Migrated ${repositories.length} repositories to multi-credential system`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`
      ALTER TABLE "credentials_access" 
      DROP CONSTRAINT "FK_credentials_access_credentialsId"
    `);

    await queryRunner.query(`
      ALTER TABLE "repository_credentials" 
      DROP CONSTRAINT "FK_repository_credentials_repositoryId"
    `);

    // Drop indices
    await queryRunner.query(`DROP INDEX "IDX_credentials_access_identity"`);
    await queryRunner.query(
      `DROP INDEX "IDX_credentials_access_credentialsId"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_repository_credentials_isDefault"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_repository_credentials_repositoryId"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "credentials_access"`);
    await queryRunner.query(`DROP TABLE "repository_credentials"`);

    console.log('Migration rolled back: Multi-credential system removed');
  }
}
