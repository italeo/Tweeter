export interface S3ProfileImageDAO {
  uploadProfileImage(
    userAlias: string,
    fileBuffer: Buffer,
    fileType: string
  ): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
  getImageUrl(userAlias: string): string;
}
