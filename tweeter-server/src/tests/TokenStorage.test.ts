import { AuthToken } from "tweeter-shared";
import { AuthTokenDAO } from "../database/dao/interfaces/AuthTokenDAO";

describe("Token Storage Validation", () => {
  let mockAuthTokenDAO: jest.Mocked<AuthTokenDAO>;

  const testToken = AuthToken.Generate();

  beforeEach(() => {
    // Mock AuthTokenDAO
    mockAuthTokenDAO = {
      storeToken: jest.fn(),
      getAuthToken: jest.fn(),
    } as unknown as jest.Mocked<AuthTokenDAO>;
  });

  it("should store the token in the database successfully", async () => {
    // Mock the storeToken method to resolve without errors
    mockAuthTokenDAO.storeToken.mockResolvedValue();

    // Act: Store the token
    await mockAuthTokenDAO.storeToken(testToken);

    // Debugging
    console.log("Stored Token:", testToken);

    // Assert
    expect(mockAuthTokenDAO.storeToken).toHaveBeenCalledWith(testToken);
  });

  it("should retrieve the stored token from the database", async () => {
    // Mock the getAuthToken method to return the stored token
    mockAuthTokenDAO.getAuthToken.mockResolvedValue(testToken);

    // Act: Retrieve the token
    const retrievedToken = await mockAuthTokenDAO.getAuthToken(testToken.token);

    // Debugging
    console.log("Retrieved Token:", retrievedToken);

    // Assert
    expect(mockAuthTokenDAO.getAuthToken).toHaveBeenCalledWith(testToken.token);
    expect(retrievedToken).toEqual(testToken);
  });
});
