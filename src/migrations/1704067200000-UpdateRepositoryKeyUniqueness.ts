import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRepositoryKeyUniqueness1704067200000 implements MigrationInterface {
    name = 'UpdateRepositoryKeyUniqueness1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing unique constraint on repositoryNameKey
        await queryRunner.query(`ALTER TABLE "repositories" DROP CONSTRAINT IF EXISTS "UQ_repository_repositoryNameKey"`);
        await queryRunner.query(`ALTER TABLE "repositories" DROP CONSTRAINT IF EXISTS "repositories_repositoryNameKey_key"`);
        
        // Create a new composite unique constraint on workspaceId and repositoryNameKey
        await queryRunner.query(`ALTER TABLE "repositories" ADD CONSTRAINT "UQ_repositories_workspaceId_repositoryNameKey" UNIQUE ("workspaceId", "repositoryNameKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the composite unique constraint
        await queryRunner.query(`ALTER TABLE "repositories" DROP CONSTRAINT "UQ_repositories_workspaceId_repositoryNameKey"`);
        
        // Restore the original unique constraint on repositoryNameKey
        await queryRunner.query(`ALTER TABLE "repositories" ADD CONSTRAINT "UQ_repository_repositoryNameKey" UNIQUE ("repositoryNameKey")`);
    }
}
