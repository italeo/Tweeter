import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
} from "@aws-sdk/client-dynamodb";

const createAuthTokenTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "AuthTokens",
    KeySchema: [
      { AttributeName: "token", KeyType: "HASH" as KeyType }, // Primary key
    ],
    AttributeDefinitions: [
      { AttributeName: "token", AttributeType: "S" as ScalarAttributeType }, // String type for token
      { AttributeName: "timestamp", AttributeType: "N" as ScalarAttributeType }, // Number type for timestamp
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TimestampIndex", // GSI name
        KeySchema: [{ AttributeName: "timestamp", KeyType: "HASH" as KeyType }],
        Projection: {
          ProjectionType: "ALL" as ProjectionType,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, // Adjust based on expected usage
      WriteCapacityUnits: 5,
    },
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("AuthTokens Table created successfully with GSI:", data);
  } catch (error) {
    console.error("Error creating AuthTokens Table:", error);
  }
};

createAuthTokenTable();
