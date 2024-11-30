import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

// Mock the DynamoDBClient
jest.mock("@aws-sdk/client-dynamodb");

describe("DynamoFollowDAO FolloweeCount Tests", () => {
  let dao: DynamoFollowDAO;
  let mockSend: jest.Mock;

  beforeEach(() => {
    // Create a new mock for the DynamoDBClient's send method
    mockSend = jest.fn();
    // Replace the client with a mocked implementation
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));
    dao = new DynamoFollowDAO();
  });

  it("should return the correct followee count for a user", async () => {
    // Mock the DynamoDB response
    mockSend.mockResolvedValueOnce({ Count: 3 });

    const userAlias = "@testUser";
    const count = await dao.getFolloweeCount(userAlias);

    // Log the call for debugging
    console.log("mockSend.calls:", mockSend.mock.calls);

    // Verify that the mocked client received the correct command
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          TableName: "Followers",
          IndexName: "FolloweeIndex",
          KeyConditionExpression: "followerAlias = :followerAlias",
          ExpressionAttributeValues: {
            ":followerAlias": { S: userAlias },
          },
          Select: "COUNT",
          ConsistentRead: false,
        },
      })
    );

    // Assert the result
    expect(count).toBe(3);
  });

  it("should return 0 if a user has no followees", async () => {
    // Mock the DynamoDB response
    mockSend.mockResolvedValueOnce({ Count: 0 });

    const userAlias = "@noFolloweesUser";
    const count = await dao.getFolloweeCount(userAlias);

    // Assert the result
    expect(count).toBe(0);
  });
});
