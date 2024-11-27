import bcrypt from "bcryptjs";
import { UserDAO } from "../database/dao/interfaces/UserDAO";
import { User } from "tweeter-shared";

jest.mock("bcryptjs");

describe("Hashed Password Validation", () => {
  let mockUserDAO: jest.Mocked<UserDAO>;

  const testAlias = "@amy";
  const testPassword = "password123";
  const testHashedPassword = "$2b$10$hashedpassword123";

  beforeEach(() => {
    // Mock UserDAO
    mockUserDAO = {
      getPasswordHash: jest.fn(),
    } as unknown as jest.Mocked<UserDAO>;
  });

  it("should validate the stored password hash matches the original password", async () => {
    // Mock DAO to return the hashed password
    mockUserDAO.getPasswordHash.mockResolvedValue(testHashedPassword);

    // Mock bcrypt.compare to simulate valid password
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Act: Retrieve the hashed password and validate it
    const storedHash = await mockUserDAO.getPasswordHash(testAlias);
    const isValidPassword = await bcrypt.compare(testPassword, storedHash);

    // Debugging
    console.log("Stored Hash:", storedHash);
    console.log("Is Valid Password:", isValidPassword);

    // Assert
    expect(mockUserDAO.getPasswordHash).toHaveBeenCalledWith(testAlias);
    expect(isValidPassword).toBe(true);
  });

  it("should fail validation if the password does not match the stored hash", async () => {
    // Mock DAO to return the hashed password
    mockUserDAO.getPasswordHash.mockResolvedValue(testHashedPassword);

    // Mock bcrypt.compare to simulate invalid password
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // Act: Retrieve the hashed password and validate it
    const storedHash = await mockUserDAO.getPasswordHash(testAlias);
    const isValidPassword = await bcrypt.compare("wrongpassword", storedHash);

    // Assert
    expect(mockUserDAO.getPasswordHash).toHaveBeenCalledWith(testAlias);
    expect(isValidPassword).toBe(false);
  });
});
