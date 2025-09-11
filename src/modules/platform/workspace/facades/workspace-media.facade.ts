import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { S3Service } from '../../shared/services/s3.service';

@Injectable()
export class WorkspaceMediaFacade {
  private readonly logger = new Logger(WorkspaceMediaFacade.name);

  constructor(private readonly s3Service: S3Service) {}

  /**
   * Set logo for a workspace by uploading to S3
   * @param workspaceId - The workspace ID
   * @param logoBuffer - The logo image buffer
   * @param mimeType - The MIME type of the image
   * @returns The signed URL for the uploaded logo
   */
  async setWorkspaceLogo(workspaceId: string, logoBuffer: Buffer, mimeType: string): Promise<string> {
    // Validate image type
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid image type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (logoBuffer.length > maxSize) {
      throw new BadRequestException('Logo file size cannot exceed 5MB');
    }

    const logoKey = this.generateLogoKey(workspaceId);

    try {
      await this.s3Service.uploadFile(logoKey, logoBuffer, mimeType);
      this.logger.log(`Successfully uploaded logo for workspace ${workspaceId}`);
      
      // Get the signed URL for the uploaded logo
      const logoUrl = await this.getWorkspaceLogoUrl(workspaceId);
      if (!logoUrl) {
        throw new Error('Failed to generate logo URL after upload');
      }
      
      return logoUrl;
    } catch (error) {
      this.logger.error(`Failed to upload logo for workspace ${workspaceId}: ${error.message}`);
      throw new Error(`Failed to upload workspace logo: ${error.message}`);
    }
  }

  /**
   * Get signed URL for workspace logo
   * @param workspaceId - The workspace ID
   * @returns Signed URL for the logo or null if logo doesn't exist
   */
  async getWorkspaceLogoUrl(workspaceId: string): Promise<string | null> {
    const logoKey = this.generateLogoKey(workspaceId);

    try {
      // Check if logo exists before generating signed URL
      const logoExists = await this.s3Service.fileExists(logoKey);
      if (!logoExists) {
        return null;
      }

      // Generate signed URL valid for 1 hour
      const signedUrl = await this.s3Service.getSignedUrl(logoKey, 3600);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to get logo URL for workspace ${workspaceId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete workspace logo
   * @param workspaceId - The workspace ID
   */
  async deleteWorkspaceLogo(workspaceId: string): Promise<void> {
    const logoKey = this.generateLogoKey(workspaceId);

    try {
      // Check if logo exists
      const logoExists = await this.s3Service.fileExists(logoKey);
      if (!logoExists) {
        throw new NotFoundException('Workspace logo not found');
      }

      await this.s3Service.deleteFile(logoKey);
      this.logger.log(`Successfully deleted logo for workspace ${workspaceId}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete logo for workspace ${workspaceId}: ${error.message}`);
      throw new Error(`Failed to delete workspace logo: ${error.message}`);
    }
  }

  /**
   * Check if workspace has a logo
   * @param workspaceId - The workspace ID
   */
  async hasWorkspaceLogo(workspaceId: string): Promise<boolean> {
    const logoKey = this.generateLogoKey(workspaceId);
    return await this.s3Service.fileExists(logoKey);
  }

  /**
   * Generate S3 key for workspace logo
   * @param workspaceId - The workspace ID
   */
  private generateLogoKey(workspaceId: string): string {
    return `workspaces/${workspaceId}/logo.png`;
  }
}
