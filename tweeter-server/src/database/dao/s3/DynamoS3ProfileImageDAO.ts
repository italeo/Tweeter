import {
  ObjectCannedACL,
  PutObjectCommand,
  DeleteObjectCommand,
  S3,
} from "@aws-sdk/client-s3";
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
    if (!userAlias || !fileType) {
      throw new Error("Invalid userAlias or fileType.");
    }

    const validMimeTypes = ["image/jpeg", "image/png"];
    if (!validMimeTypes.includes(fileType)) {
      throw new Error(`Unsupported file type: ${fileType}.`);
    }

    const extension = fileType.split("/")[1]; // e.g., "jpeg" from "image/jpeg"
    const key = `${userAlias}.${extension}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      ACL: "public-read" as ObjectCannedACL,
    };

    try {
      await this.s3.send(new PutObjectCommand(params));
      console.log(`Image uploaded successfully for user ${userAlias}: ${key}`);
      return `https://${this.bucketName}.s3.us-west-2.amazonaws.com/${key}`;
    } catch (error) {
      console.error(`Error uploading image for user ${userAlias}:`, error);
      throw error;
    }
  }

  // Deletes an image from S3
  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl.includes(this.bucketName)) {
      throw new Error("Invalid image URL.");
    }

    const key = imageUrl.split(`${this.bucketName}/`)[1];
    if (!key) {
      throw new Error("Invalid image URL: Key extraction failed.");
    }

    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
      console.log(`Image deleted successfully: ${key}`);
    } catch (error) {
      console.error(`Error deleting image for key ${key}:`, error);
      throw error;
    }
  }

  // Generates the public URL for an image based on the user alias
  getImageUrl(userAlias: string): string {
    if (!userAlias) {
      throw new Error("Invalid user alias.");
    }

    // Assume the default format is JPEG unless specified otherwise
    const key = `${userAlias}.jpg`;
    return `https://${this.bucketName}.s3.us-west-2.amazonaws.com/${key}`;
  }
}
