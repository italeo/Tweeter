import { AuthToken } from "tweeter-shared";
import { DynamoAuthTokenDAO } from "../database/dao/dynamodb/DynamoAuthTokenDAO";

describe("DynamoAuthTokenDAO", () => {
  let dao: DynamoAuthTokenDAO;

  beforeEach(() => {
    dao = new DynamoAuthTokenDAO();
  });

  it("should store and retrieve an AuthToken", async () => {
    const token = AuthToken.Generate();
    await dao.storeToken(token);

    const retrievedToken = await dao.getAuthToken(token.token);
    expect(retrievedToken).not.toBeNull();
    expect(retrievedToken!.token).toBe(token.token);
    expect(retrievedToken!.timestamp).toBe(token.timestamp);
  });

  it("should delete an AuthToken", async () => {
    const token = AuthToken.Generate();
    await dao.storeToken(token);

    await dao.deleteAuthToken(token.token);

    const retrievedToken = await dao.getAuthToken(token.token);
    expect(retrievedToken).toBeNull();
  });
});
