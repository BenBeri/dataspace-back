import { Injectable, Logger } from '@nestjs/common';
import {
  CreateKeyCommand,
  CreateKeyCommandInput,
  EncryptCommand,
  DecryptCommand,
  KMSClient,
  CreateAliasCommand,
  DescribeKeyCommand,
  KeyState,
} from '@aws-sdk/client-kms';
import { ConfigService } from '@nestjs/config';
import { IKeyManagementService } from '../interfaces/key-management.interface';

@Injectable()
export class KmsService implements IKeyManagementService {
  private readonly logger = new Logger(KmsService.name);
  private kmsClient: KMSClient;

  constructor(private configService: ConfigService) {
    this.initializeAwsClient();
  }

  /**
   * Initialize AWS KMS client with configuration validation
   */
  private initializeAwsClient(): void {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    // Validate required AWS credentials
    if (!region || !accessKeyId || !secretAccessKey) {
      const missingVars: string[] = [];
      if (!region) missingVars.push('AWS_REGION');
      if (!accessKeyId) missingVars.push('AWS_ACCESS_KEY_ID');
      if (!secretAccessKey) missingVars.push('AWS_SECRET_ACCESS_KEY');
      
      const errorMessage = `Missing required AWS environment variables: ${missingVars.join(', ')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.kmsClient = new KMSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`AWS KMS client initialized for region: ${region}`);
  }

  /**
   * Creates a new KMS key for a workspace
   * Implements IKeyManagementService.createKey with AWS KMS specifics and workspace context
   * @param keyIdentifier - The workspace ID to create a key for
   * @param metadata - Optional metadata (merged with workspace-specific tags)
   * @returns The Key ID of the created KMS key
   */
  async createKey(keyIdentifier: string, metadata?: Record<string, string>): Promise<string> {
    try {
      const environment = this.configService.get<string>('NODE_ENV') || 'development';
      const aliasName = `alias/dataspace/${environment}/workspace/${keyIdentifier}`;

      // Merge provided metadata with workspace-specific tags
      const defaultTags = [
        {
          TagKey: 'Environment',
          TagValue: environment,
        },
        {
          TagKey: 'WorkspaceId',
          TagValue: keyIdentifier,
        },
        {
          TagKey: 'Service',
          TagValue: 'dataspace',
        },
      ];

      // Add custom metadata as tags
      const customTags = metadata ? Object.entries(metadata).map(([key, value]) => ({
        TagKey: key,
        TagValue: value,
      })) : [];

      // Create the key
      const createKeyInput: CreateKeyCommandInput = {
        Description: `Encryption key for Dataspace workspace ${keyIdentifier}`,
        KeyUsage: 'ENCRYPT_DECRYPT',
        Origin: 'AWS_KMS',
        MultiRegion: false,
        Tags: [...defaultTags, ...customTags],
      };

      const createKeyCommand = new CreateKeyCommand(createKeyInput);
      const createKeyResponse = await this.kmsClient.send(createKeyCommand);

      if (!createKeyResponse.KeyMetadata?.KeyId) {
        throw new Error('Failed to create KMS key: No KeyId returned');
      }

      const keyId = createKeyResponse.KeyMetadata.KeyId;

      // Create an alias for easier management (AWS-specific feature)
      try {
        const createAliasCommand = new CreateAliasCommand({
          AliasName: aliasName,
          TargetKeyId: keyId,
        });
        await this.kmsClient.send(createAliasCommand);
        this.logger.log(`Created KMS alias ${aliasName} for key ${keyId}`);
      } catch (error) {
        this.logger.warn(`Failed to create alias for key ${keyId}: ${error.message}`);
        // Continue even if alias creation fails
      }

      this.logger.log(`Successfully created KMS key ${keyId} for workspace ${keyIdentifier}`);
      return keyId;
    } catch (error) {
      this.logger.error(`Failed to create KMS key for workspace ${keyIdentifier}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encrypts data using a KMS key
   * @param keyId - The KMS key ID to use for encryption
   * @param plaintext - The data to encrypt
   * @returns The encrypted data as a base64 string
   */
  async encrypt(keyId: string, plaintext: string): Promise<string> {
    try {
      const encryptCommand = new EncryptCommand({
        KeyId: keyId,
        Plaintext: Buffer.from(plaintext, 'utf-8'),
      });

      const encryptResponse = await this.kmsClient.send(encryptCommand);

      if (!encryptResponse.CiphertextBlob) {
        throw new Error('Failed to encrypt data: No ciphertext returned');
      }

      // Convert the encrypted blob to base64 string for storage
      const encryptedData = Buffer.from(encryptResponse.CiphertextBlob).toString('base64');
      return encryptedData;
    } catch (error) {
      this.logger.error(`Failed to encrypt data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypts data using KMS
   * @param ciphertext - The encrypted data as a base64 string
   * @returns The decrypted plaintext
   */
  async decrypt(ciphertext: string): Promise<string> {
    try {
      const decryptCommand = new DecryptCommand({
        CiphertextBlob: Buffer.from(ciphertext, 'base64'),
      });

      const decryptResponse = await this.kmsClient.send(decryptCommand);

      if (!decryptResponse.Plaintext) {
        throw new Error('Failed to decrypt data: No plaintext returned');
      }

      const plaintext = Buffer.from(decryptResponse.Plaintext).toString('utf-8');
      return plaintext;
    } catch (error) {
      this.logger.error(`Failed to decrypt data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if a KMS key is available and usable
   * @param keyId - The KMS key ID to check
   * @returns true if the key is enabled and available
   */
  async isKeyAvailable(keyId: string): Promise<boolean> {
    try {
      const describeKeyCommand = new DescribeKeyCommand({
        KeyId: keyId,
      });

      const response = await this.kmsClient.send(describeKeyCommand);
      return response.KeyMetadata?.KeyState === KeyState.Enabled;
    } catch (error) {
      this.logger.error(`Failed to check key availability: ${error.message}`);
      return false;
    }
  }
}
