import { DynamoUserDAO } from "../database/dao/dynamodb/DynamoUserDAO";
import { DynamoAuthTokenDAO } from "../database/dao/dynamodb/DynamoAuthTokenDAO";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AuthToken } from "tweeter-shared";
import { DynamoS3ProfileImageDAO } from "../database/dao/s3/DynamoS3ProfileImageDAO";

// Create a DynamoDB client instance
const client = new DynamoDBClient({ region: "us-west-2" });

// Mock instance of DynamoS3ProfileImageDAO
const mockProfileImageDAO = {
  uploadProfileImage: jest
    .fn()
    .mockResolvedValue("https://mock-url.com/image.png"),
  deleteImage: jest.fn().mockResolvedValue(undefined),
  getImageUrl: jest.fn().mockReturnValue("https://mock-url.com/image.png"),
} as unknown as DynamoS3ProfileImageDAO;

// Create DAO instances
const userDAO = new DynamoUserDAO(mockProfileImageDAO); // Pass mock for profile image DAO
const authTokenDAO = new DynamoAuthTokenDAO(); // Pass real client to AuthTokenDAO

describe("Integration Tests for DynamoDB DAO", () => {
  // Test getUserByAlias
  describe("getUserByAlias", () => {
    it("should fetch a user by alias '@dee'", async () => {
      const alias = "@dee";
      const user = await userDAO.getUserByAlias(alias);

      expect(user).not.toBeNull();
      expect(user?.alias).toBe(alias);
      expect(user?.firstName).toBe("Dee");
      expect(user?.lastName).toBe("Dempsey");
      console.log("Fetched user:", user);
    });

    it("should return null for a non-existent alias", async () => {
      const alias = "@nonexistent";
      const user = await userDAO.getUserByAlias(alias);

      expect(user).toBeNull();
      console.log("No user found for alias:", alias);
    });
  });

  // Test getPasswordHash
  describe("getPasswordHash", () => {
    it("should fetch the password hash for alias '@dee'", async () => {
      const alias = "@dee";
      const passwordHash = await userDAO.getPasswordHash(alias);

      expect(passwordHash).toBeDefined();
      expect(passwordHash).toContain("$2a$10"); // Bcrypt hashes typically start with this
      console.log("Fetched password hash:", passwordHash);
    });

    it("should throw an error for a non-existent alias", async () => {
      const alias = "@nonexistent";

      await expect(userDAO.getPasswordHash(alias)).rejects.toThrow(
        "Password hash not found for user."
      );
    });
  });

  // Test getAuthToken
  describe("getAuthToken", () => {
    it("should fetch an auth token by token value", async () => {
      const tokenValue = "c8613c0b-7cda-4ca4-9840-2dc609bb1ece";
      const token = await authTokenDAO.getAuthToken(tokenValue);

      expect(token).not.toBeNull();
      expect(token?.token).toBe(tokenValue);
      console.log("Fetched token:", token);
    });

    it("should return null for a non-existent token", async () => {
      const tokenValue = "non-existent-token";
      const token = await authTokenDAO.getAuthToken(tokenValue);

      expect(token).toBeNull();
      console.log("No token found for value:", tokenValue);
    });
  });

  // Test storeToken
  describe("storeToken", () => {
    it("should store a new auth token in the database", async () => {
      const newToken = AuthToken.Generate(); // Generate a new token

      await authTokenDAO.storeToken(newToken);

      // Fetch the token to confirm it was stored
      const fetchedToken = await authTokenDAO.getAuthToken(newToken.token);
      expect(fetchedToken).not.toBeNull();
      expect(fetchedToken?.token).toBe(newToken.token);
      console.log("Stored and verified token:", fetchedToken);
    });
  });
});
