import { DynamoBaseDAO } from "../database/dao/dynamodb/DynamoBaseDAO";

// Test class to invoke fetchUserDetails
class TestDAO extends DynamoBaseDAO {
  async testFetchUserDetails(alias: string) {
    try {
      const user = await this.fetchUserDetails(alias);
      console.log(`User fetched for alias '${alias}':`, user);
    } catch (error) {
      console.error(`Error fetching user details for alias '${alias}':`, error);
    }
  }
}

(async () => {
  const testDAO = new TestDAO();

  // Test with valid aliases
  const validAliases = ["@allen", "@amy", "@bob"]; // Add more aliases from your table
  for (const alias of validAliases) {
    await testDAO.testFetchUserDetails(alias);
  }

  // Test with invalid alias
  const invalidAlias = "@nonexistent";
  await testDAO.testFetchUserDetails(invalidAlias);
})();
