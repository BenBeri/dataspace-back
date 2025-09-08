import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IKeyManagementService } from './interfaces/key-management.interface';
import { KmsService } from './providers/kms.service';

// Export the token for dependency injection
export const KEY_MANAGEMENT_SERVICE = 'KEY_MANAGEMENT_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KEY_MANAGEMENT_SERVICE,
      useFactory: async (configService: ConfigService): Promise<IKeyManagementService> => {
        // In the future, you can switch providers based on config
        const provider = configService.get<string>('KEY_MANAGEMENT_PROVIDER', 'aws-kms');
        
        switch (provider) {
          case 'aws-kms':
            return new KmsService(configService);
          // Future providers can be added here
          // case 'azure-keyvault':
          //   return new AzureKeyVaultService(configService);
          // case 'gcp-kms':
          //   return new GcpKmsService(configService);
          // case 'hashicorp-vault':
          //   return new HashicorpVaultService(configService);
          default:
            throw new Error(`Unknown key management provider: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [KEY_MANAGEMENT_SERVICE],
})
export class KeyManagementModule {}
