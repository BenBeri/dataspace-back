/**
 * Generic interface for key management operations
 * Provider-agnostic interface that can be implemented by different key management services
 */
export interface IKeyManagementService {
  /**
   * Creates a new encryption key
   * @param keyIdentifier - Unique identifier for the key (e.g., workspace ID, tenant ID)
   * @param metadata - Optional metadata to associate with the key
   * @returns The key identifier that can be used for encryption/decryption
   */
  createKey(keyIdentifier: string, metadata?: Record<string, string>): Promise<string>;

  /**
   * Encrypts data using the specified key
   * @param keyId - The key identifier to use for encryption
   * @param plaintext - The data to encrypt
   * @returns The encrypted data as a string
   */
  encrypt(keyId: string, plaintext: string): Promise<string>;

  /**
   * Decrypts data
   * @param ciphertext - The encrypted data to decrypt
   * @returns The decrypted plaintext
   */
  decrypt(ciphertext: string): Promise<string>;

  /**
   * Checks if a key is available and can be used for operations
   * @param keyId - The key identifier to check
   * @returns true if the key is available and usable
   */
  isKeyAvailable(keyId: string): Promise<boolean>;
}
