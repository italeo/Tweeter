import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: "us-west-2" });

const FEED_TABLE_NAME = "Feed";
const USERS_TABLE_NAME = "Users";

// Function to fetch all items from a DynamoDB table
async function fetchAllItems(
  tableName: string,
  projectionExpression: string
): Promise<any[]> {
  let items: any[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  do {
    const params: ScanCommandInput = {
      TableName: tableName,
      ProjectionExpression: projectionExpression,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const result = await dynamoDB.send(new ScanCommand(params));
    items = items.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

// Main function to validate aliases
async function validateFeedAndUsers(): Promise<void> {
  try {
    // Step 1: Fetch all `authorAlias` values from the "Feed" table
    const feedItems = await fetchAllItems(FEED_TABLE_NAME, "authorAlias");
    const feedAliases = new Set(feedItems.map((item) => item.authorAlias.S));

    // Step 2: Fetch all `alias` values from the "Users" table
    const userItems = await fetchAllItems(USERS_TABLE_NAME, "alias");
    const userAliases = new Set(userItems.map((item) => item.alias.S));

    // Step 3: Find missing aliases
    const missingAliases = [...feedAliases].filter(
      (alias) => !userAliases.has(alias)
    );

    if (missingAliases.length === 0) {
      console.log("No missing aliases found. Both tables are consistent.");
      return;
    }

    console.log(`Found ${missingAliases.length} missing aliases:`);
    console.log(missingAliases);
  } catch (error) {
    console.error("Error validating Feed and Users tables:", error);
  }
}

// Run the script
validateFeedAndUsers();
