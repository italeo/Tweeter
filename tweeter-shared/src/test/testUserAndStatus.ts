import { Status } from "../model/domain/Status";
import { User } from "../model/domain/User";

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
  alias: "@allen",
  imageUrl: "https://example.com/allen.jpg",
};

// Test cases for StatusDto
const validStatusDto = {
  post: "Hello, world!",
  user: validUserDto,
  timestamp: Date.now(),
};

const invalidStatusDto = {
  post: "Hello, world!",
  user: null, // Missing user
  timestamp: Date.now(),
};

console.log("Testing valid UserDto:");
const user = User.fromDto(validUserDto);
console.log("Resulting User:", user);

console.log("Testing invalid UserDto:");
const invalidUser = User.fromDto(invalidUserDto);
console.log("Resulting User for invalid UserDto:", invalidUser);

console.log("Testing valid StatusDto:");
const status = Status.fromDto(validStatusDto);
console.log("Resulting Status:", status);

console.log("Testing invalid StatusDto:");
try {
  const invalidStatusDto = {
    post: "Hello, world!",
    user: { firstName: "", lastName: "", alias: "", imageUrl: "" }, // Invalid user
    timestamp: Date.now(),
  };

  const invalidStatus = Status.fromDto(invalidStatusDto);
  console.log("Resulting Status for invalid StatusDto:", invalidStatus);
} catch (error) {
  console.error("Caught error for invalid StatusDto:", error);
}
