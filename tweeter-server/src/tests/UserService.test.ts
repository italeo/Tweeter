import bcrypt from "bcryptjs";
import { AuthToken, User } from "tweeter-shared";
import { AuthTokenDAO } from "../database/dao/interfaces/AuthTokenDAO";
import { UserDAO } from "../database/dao/interfaces/UserDAO";
import { DynamoS3ProfileImageDAO } from "../database/dao/s3/DynamoS3ProfileImageDAO";
import { UserService } from "../model/service/UserService";

jest.mock("bcryptjs");

describe("UserService", () => {
  let mockUserDAO: jest.Mocked<UserDAO>;
  let mockAuthTokenDAO: jest.Mocked<AuthTokenDAO>;
  let mockProfileImageDAO: jest.Mocked<DynamoS3ProfileImageDAO>;
  let userService: UserService;

  const mockUser = new User(
    "Amy",
    "Ames",
    "@amy",
    "https://example.com/amy.png",
    "hashed_password"
  );

  const mockAuthToken = AuthToken.Generate();

  beforeEach(() => {
    // Create mocked DAO instances
    mockUserDAO = {
      getUserByAlias: jest.fn(),
      getPasswordHash: jest.fn(),
      createUserWithPassword: jest.fn(),
    } as unknown as jest.Mocked<UserDAO>;

    mockAuthTokenDAO = {
      createAuthToken: jest.fn(), // Include createAuthToken in the mock
      storeToken: jest.fn(),
      deleteAuthToken: jest.fn(),
      getAuthToken: jest.fn(),
    } as unknown as jest.Mocked<AuthTokenDAO>;

    mockProfileImageDAO = {
      uploadProfileImage: jest.fn(),
    } as unknown as jest.Mocked<DynamoS3ProfileImageDAO>;

    // Instantiate UserService with mocked DAOs
    userService = new UserService(
      mockUserDAO,
      mockAuthTokenDAO,
      mockProfileImageDAO
    );
  });

  describe("login", () => {
    it("should log in a user with valid credentials", async () => {
      // Mock DAO behavior
      mockUserDAO.getUserByAlias.mockResolvedValue(mockUser);
      mockUserDAO.getPasswordHash.mockResolvedValue("$2a$10$hashedpassword");
      mockAuthTokenDAO.storeToken.mockResolvedValue(undefined);

      // Mock bcrypt comparison
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true); // Password matches

      // Act
      const result = await userService.login("@amy", "password");

      // Debugging
      console.log("Login Result:", result);

      // Assert
      expect(mockUserDAO.getUserByAlias).toHaveBeenCalledWith("@amy");
      expect(mockUserDAO.getPasswordHash).toHaveBeenCalledWith("@amy");
      expect(mockAuthTokenDAO.storeToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
      expect(result[0].alias).toBe("@amy");
      expect(result[1]).toEqual(
        expect.objectContaining({
          token: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe("register", () => {
    it("should register a new user", async () => {
      // Arrange
      mockProfileImageDAO.uploadProfileImage.mockResolvedValue(
        "https://example.com/newuser.png"
      );
      mockUserDAO.createUserWithPassword.mockResolvedValue();
      mockAuthTokenDAO.createAuthToken.mockResolvedValue(); // Mock createAuthToken
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

      // Act
      const result = await userService.register(
        "New",
        "User",
        "@newuser",
        "password",
        new Uint8Array([1, 2, 3]),
        "png"
      );

      // Debugging
      console.log("Register Result:", result);

      // Assert
      expect(mockProfileImageDAO.uploadProfileImage).toHaveBeenCalledWith(
        "@newuser",
        expect.any(Buffer),
        "png"
      );
      expect(mockUserDAO.createUserWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          alias: "@newuser",
          firstName: "New",
          lastName: "User",
        }),
        "hashed_password"
      );
      expect(mockAuthTokenDAO.createAuthToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
      expect(result[0].alias).toBe("@newuser");
      expect(result[1]).toEqual(
        expect.objectContaining({
          token: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });

    it("should throw an error if the alias already exists", async () => {
      // Arrange
      mockUserDAO.createUserWithPassword.mockRejectedValue(
        new Error("Alias already exists")
      );

      // Act & Assert
      await expect(
        userService.register(
          "Existing",
          "User",
          "@existinguser",
          "password",
          new Uint8Array([1, 2, 3]),
          "jpg"
        )
      ).rejects.toThrow("Error creating new user.");
      expect(mockUserDAO.createUserWithPassword).toHaveBeenCalled();
    });
  });

  describe("getUser", () => {
    it("should retrieve a user with a valid auth token", async () => {
      // Arrange
      mockAuthTokenDAO.getAuthToken.mockResolvedValue(mockAuthToken);
      mockUserDAO.getUserByAlias.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUser(mockAuthToken.token, "@amy");

      // Debugging
      console.log("Get User Result:", result);

      // Assert
      expect(mockAuthTokenDAO.getAuthToken).toHaveBeenCalledWith(
        mockAuthToken.token
      );
      expect(mockUserDAO.getUserByAlias).toHaveBeenCalledWith("@amy");

      expect(result).not.toBeNull();
      expect(result!.alias).toBe("@amy");
    });

    it("should throw an error if the auth token is invalid", async () => {
      // Arrange
      mockAuthTokenDAO.getAuthToken.mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.getUser("invalid_token", "@amy")
      ).rejects.toThrow("Invalid or expired authentication token.");
    });

    it("should throw an error if the user is not found", async () => {
      // Arrange
      mockAuthTokenDAO.getAuthToken.mockResolvedValue(mockAuthToken);
      mockUserDAO.getUserByAlias.mockResolvedValue(null);

      // Act & Assert
      await expect(
        userService.getUser(mockAuthToken.token, "@nonexistent")
      ).rejects.toThrow("User not found.");
    });
  });
});
