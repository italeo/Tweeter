import { ObjectCannedACL, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { S3ProfileImageDAO } from "../interfaces/S3ProfileImageDAO";

export class DynamoS3ProfileImageDAO implements S3ProfileImageDAO {
  private readonly s3: S3;
  private readonly bucketName: string;

  public constructor() {
    this.s3 = new S3({ region: "us-west-2" });
    this.bucketName = "profile-images-tweeter";
  }

  // Uploads an image to S3 and returns the public URL
  async uploadProfileImage(
    userAlias: string,
    fileBuffer: Buffer,
    fileType: string
  ): Promise<string> {
    const key = `${userAlias}.${fileType.split("/")[1]}`; // e.g., "user123.jpg"

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      ACL: "public-read" as ObjectCannedACL, // Explicitly cast to ObjectCannedACL
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      console.log(`Image uploaded successfully: ${key}`);
      return `https://${this.bucketName}.s3.us-west-2.amazonaws.com/${key}`;
    } catch (error) {
      console.error(`Error uploading image:`, error);
      throw error;
    }
  }
  // Deletes an image from S3
  async deleteImage(imageUrl: string): Promise<void> {
    const key = imageUrl.split(`${this.bucketName}/`)[1];

    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params);
      console.log(`Image deleted successfully: ${key}`);
    } catch (error) {
      console.error(`Error deleting image:`, error);
      throw error;
    }
  }

  // Generates the public URL for an image based on the user alias
  getImageUrl(userAlias: string): string {
    return `https://${this.bucketName}.s3.us-west-2.amazonaws.com/${userAlias}`;
  }
}
