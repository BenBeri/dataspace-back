# Key Management Module

This module provides a flexible, provider-agnostic approach to key management for the application.

## Architecture

The module uses NestJS dependency injection with a factory pattern to allow easy switching between different key management providers.

### Components

1. **IKeyManagementService Interface** - Defines the contract for key management operations
2. **Factory Provider** - Creates the appropriate key management service based on configuration
3. **KmsService** - AWS KMS implementation (default)

## Usage

### In Your Module

```typescript
import { KeyManagementModule } from '../key-management/key-management.module';

@Module({
  imports: [KeyManagementModule],
  // ...
})
export class YourModule {}
```

### In Your Service/Provider

```typescript
import { Inject } from '@nestjs/common';
import type { IKeyManagementService } from '../key-management/interfaces/key-management.interface';
import { KEY_MANAGEMENT_SERVICE } from '../key-management/key-management.module';

@Injectable()
export class YourService {
  constructor(
    @Inject(KEY_MANAGEMENT_SERVICE)
    private readonly keyManagementService: IKeyManagementService,
  ) {}

  async createKey(identifier: string): Promise<string> {
    return await this.keyManagementService.createKey(identifier, {
      // Optional metadata
      Purpose: 'encryption',
      Owner: 'user-123',
    });
  }

  async encryptData(keyId: string, data: string): Promise<string> {
    return await this.keyManagementService.encrypt(keyId, data);
  }

  async decryptData(encryptedData: string): Promise<string> {
    return await this.keyManagementService.decrypt(encryptedData);
  }
}
```

## Configuration

The module selects the key management provider based on the `KEY_MANAGEMENT_PROVIDER` environment variable:

```env
# Default: aws-kms
KEY_MANAGEMENT_PROVIDER=aws-kms

# For AWS KMS, you also need:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Adding New Providers

To add a new key management provider:

1. Create a new service that implements `IKeyManagementService`:

```typescript
// src/modules/platform/key-management/providers/azure-keyvault.service.ts
import { Injectable } from '@nestjs/common';
import { IKeyManagementService } from '../interfaces/key-management.interface';

@Injectable()
export class AzureKeyVaultService implements IKeyManagementService {
  async createKey(keyIdentifier: string, metadata?: Record<string, string>): Promise<string> {
    // Implementation
  }

  async encrypt(keyId: string, plaintext: string): Promise<string> {
    // Implementation
  }

  async decrypt(ciphertext: string): Promise<string> {
    // Implementation
  }

  async isKeyAvailable(keyId: string): Promise<boolean> {
    // Implementation
  }
}
```

2. Update the factory in `key-management.module.ts`:

```typescript
useFactory: async (configService: ConfigService): Promise<IKeyManagementService> => {
  const provider = configService.get<string>('KEY_MANAGEMENT_PROVIDER', 'aws-kms');
  
  switch (provider) {
    case 'aws-kms':
      return new KmsService(configService);
    case 'azure-keyvault':
      return new AzureKeyVaultService(configService);
    case 'hashicorp-vault':
      return new HashicorpVaultService(configService);
    default:
      throw new Error(`Unknown key management provider: ${provider}`);
  }
},
```

## Testing

When testing services that use key management:

```typescript
describe('YourService', () => {
  let service: YourService;
  let keyManagementService: IKeyManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: KEY_MANAGEMENT_SERVICE,
          useValue: {
            createKey: jest.fn().mockResolvedValue('test-key-id'),
            encrypt: jest.fn().mockResolvedValue('encrypted-data'),
            decrypt: jest.fn().mockResolvedValue('decrypted-data'),
            isKeyAvailable: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    keyManagementService = module.get<IKeyManagementService>(KEY_MANAGEMENT_SERVICE);
  });

  // Your tests
});
```

## Benefits

1. **Provider Agnostic** - Easy to switch between AWS KMS, Azure Key Vault, HashiCorp Vault, etc.
2. **Testable** - Interface-based design makes mocking easy
3. **Configurable** - Runtime provider selection based on environment
4. **Type Safe** - Full TypeScript support with interfaces
5. **Extensible** - Easy to add new providers without changing existing code
