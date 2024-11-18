import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
} from "@aws-sdk/client-dynamodb";

const createAuthTokenTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "AuthTokens",
    KeySchema: [{ AttributeName: "token", KeyType: "HASH" as KeyType }],
    AttributeDefinitions: [
      { AttributeName: "token", AttributeType: "S" as ScalarAttributeType },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("AuthToken Table created successfully:", data);
  } catch (error) {
    console.error("Error creating AuthToken Table:", error);
  }
};

createAuthTokenTable();
