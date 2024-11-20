import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "tweeter-shared";
import { FakeData } from "tweeter-shared";

export abstract class DynamoBaseDAO {
  protected readonly client: DynamoDBClient;
  private userCache: Map<string, User> = new Map();

  public constructor() {
    this.client = new DynamoDBClient({ region: "us-west-2" });
  }

  protected async fetchUserDetails(alias: string): Promise<User> {
    if (this.userCache.has(alias)) {
      return this.userCache.get(alias)!;
    }

    const params = {
      TableName: "Users",
      Key: {
        alias: { S: alias },
      },
    };

    try {
      const data = await this.client.send(new GetItemCommand(params));
      if (data.Item) {
        const user = new User(
          data.Item.firstName?.S || "Unknown",
          data.Item.lastName?.S || "Unknown",
          alias,
          data.Item.imageUrl?.S || "https://default-image.url"
        );
        this.userCache.set(alias, user);
        return user;
      }
    } catch (error) {
      console.error(`Error fetching user details for alias: ${alias}`, error);
    }

    // Use @allen's details as the fallback
    const allen = FakeData.instance.findUserByAlias("@allen");
    if (allen) {
      this.userCache.set(alias, allen);
      return allen;
    }

    // Fallback to default user
    const fallbackUser = new User(
      "Allen",
      "Anderson",
      "@allen",
      "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png"
    );
    this.userCache.set(alias, fallbackUser);
    return fallbackUser;
  }
}
