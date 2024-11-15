import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
} from "@aws-sdk/client-dynamodb";

const createFollowersTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "Followers",
    KeySchema: [
      { AttributeName: "followeeAlias", KeyType: "HASH" as KeyType },
      { AttributeName: "followerAlias", KeyType: "RANGE" as KeyType },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "followeeAlias",
        AttributeType: "S" as ScalarAttributeType,
      },
      {
        AttributeName: "followerAlias",
        AttributeType: "S" as ScalarAttributeType,
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "FollowerIndex",
        KeySchema: [
          { AttributeName: "followerAlias", KeyType: "HASH" as KeyType },
          { AttributeName: "followeeAlias", KeyType: "RANGE" as KeyType },
        ],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("Table created successfully:", data);
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

createFollowersTable();
