import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { FakeData, AuthToken } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });

const addAuthToken = async (authToken: AuthToken) => {
  const params = {
    TableName: "AuthTokens",
    Item: {
      token: { S: authToken.token },
      timestamp: { N: authToken.timestamp.toString() },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`AuthToken ${authToken.token} added successfully!`);
  } catch (error) {
    console.error(`Error adding AuthToken ${authToken.token}:`, error);
  }
};

export const populateAuthTokens = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating AuthTokens table...");
  const authToken = fakeData.authToken;
  await addAuthToken(authToken);
  console.log("AuthTokens table populated successfully!");
};

populateAuthTokens();
