import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
} from "@aws-sdk/client-dynamodb";

const createFeedsTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "Feed",
    KeySchema: [
      { AttributeName: "alias", KeyType: "HASH" as KeyType },
      { AttributeName: "timestamp", KeyType: "RANGE" as KeyType },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "alias",
        AttributeType: "S" as ScalarAttributeType,
      },
      {
        AttributeName: "timestamp",
        AttributeType: "N" as ScalarAttributeType,
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("Feed Table created successfully:", data);
  } catch (error) {
    console.error("Error creating Feed table:", error);
  }
};

createFeedsTable();
