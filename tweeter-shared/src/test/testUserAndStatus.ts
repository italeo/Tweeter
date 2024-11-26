import { Status } from "../model/domain/Status";
import { User } from "../model/domain/User";

// Simulate the Lambda behavior for getStory with valid and invalid data

// Test cases for UserDto
const validUserDto = {
  firstName: "Allen",
  lastName: "Anderson",
  alias: "@allen",
  imageUrl: "https://example.com/allen.jpg",
};

const invalidUserDto = {
  firstName: "",
  lastName: "",
  alias: "",
  imageUrl: "",
};

// Test cases for StatusDto (mimicking DynamoDB results)
const validStatusDto = {
  post: "Hello, world!",
  user: validUserDto,
  timestamp: Date.now(),
};

const statusDtoWithNullUser = {
  post: "Hello, world!",
  user: null, // Missing user
  timestamp: Date.now(),
} as any; // Explicitly allow invalid structures for testing

const statusDtoWithInvalidUser = {
  post: "Hello, world!",
  user: invalidUserDto, // Invalid user fields
  timestamp: Date.now(),
} as any; // Explicitly allow invalid structures for testing

const testStatusConversion = (statusDto: any, description: string) => {
  console.log(`\nTesting ${description}:`);
  try {
    const status = Status.fromDto(statusDto);
    console.log("Resulting Status:", status);
  } catch (error) {
    console.error(
      `Caught error for ${description}:`,
      error instanceof Error ? error.message : error
    );
  }
};

console.log("\n=== Testing UserDto Conversion ===");

// Test valid UserDto
try {
  const user = User.fromDto(validUserDto);
  console.log("Resulting User for valid UserDto:", user);
} catch (error) {
  console.error(
    "Error with valid UserDto:",
    error instanceof Error ? error.message : error
  );
}

// Test invalid UserDto
try {
  const user = User.fromDto(invalidUserDto as any); // Explicitly allow invalid input
  console.log("Resulting User for invalid UserDto:", user);
} catch (error) {
  console.error(
    "Error with invalid UserDto:",
    error instanceof Error ? error.message : error
  );
}

console.log("\n=== Testing StatusDto Conversion ===");

// Test valid StatusDto
testStatusConversion(validStatusDto, "valid StatusDto");

// Test StatusDto with null user
testStatusConversion(statusDtoWithNullUser, "StatusDto with null user");

// Test StatusDto with invalid user
testStatusConversion(statusDtoWithInvalidUser, "StatusDto with invalid user");

// Additional edge case: Test completely invalid StatusDto
try {
  const invalidStatusDto = {
    post: null as any,
    user: null as any,
    timestamp: null as any,
  };
  console.log("\nTesting completely invalid StatusDto:");
  const status = Status.fromDto(invalidStatusDto);
  console.log("Resulting Status:", status);
} catch (error) {
  console.error(
    "Caught error for completely invalid StatusDto:",
    error instanceof Error ? error.message : error
  );
}
