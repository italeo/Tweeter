import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
} from "@aws-sdk/client-dynamodb";

const createStatusTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "Statuses",
    KeySchema: [
      { AttributeName: "alias", KeyType: "HASH" as KeyType },
      { AttributeName: "timestamp", KeyType: "RANGE" as KeyType },
    ],
    AttributeDefinitions: [
      { AttributeName: "alias", AttributeType: "S" as ScalarAttributeType },
      { AttributeName: "timestamp", AttributeType: "N" as ScalarAttributeType },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "TimestampIndex",
        KeySchema: [{ AttributeName: "timestamp", KeyType: "HASH" as KeyType }],
        Projection: { ProjectionType: "ALL" as ProjectionType },
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
    console.log("Statuses Table created successfully:", data);
  } catch (error) {
    console.error("Error creating Statuses Table:", error);
  }
};

createStatusTable();
