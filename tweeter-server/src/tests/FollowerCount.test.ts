import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

describe("DynamoFollowDAO Tests", () => {
  let dao: DynamoFollowDAO;
  let mockSend: jest.Mock;

  beforeEach(() => {
    // Mock the DynamoDBClient's send method
    mockSend = jest.fn();
    DynamoDBClient.prototype.send = mockSend; // Attach the mock to the client's send method

    // Initialize DAO
    dao = new DynamoFollowDAO();
  });

  it("should return the correct follower count for a user", async () => {
    // Mock the DynamoDB response
    mockSend.mockResolvedValueOnce({ Count: 5 });

    const userAlias = "@testUser";
    const count = await dao.getFollowerCount(userAlias);

    // Log the calls for debugging
    console.log("mockSend.calls:", mockSend.mock.calls);

    // Verify the `input` property of the `QueryCommand` object
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          TableName: "Followers",
          IndexName: "FollowerIndex",
          KeyConditionExpression: "followeeAlias = :followeeAlias",
          ExpressionAttributeValues: {
            ":followeeAlias": { S: userAlias },
          },
          Select: "COUNT",
          ConsistentRead: false,
        }),
      })
    );

    // Assert the result
    expect(count).toBe(5);
  });

  it("should return 0 if a user has no followers", async () => {
    // Mock the DynamoDB response
    mockSend.mockResolvedValueOnce({ Count: 0 });

    const userAlias = "@noFollowersUser";
    const count = await dao.getFollowerCount(userAlias);

    // Assert the result
    expect(count).toBe(0);
  });
});
