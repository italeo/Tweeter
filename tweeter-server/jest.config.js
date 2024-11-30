module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["aws-sdk-client-mock"],
  moduleDirectories: ["node_modules"],
};
