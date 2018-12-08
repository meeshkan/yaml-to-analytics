module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ],
    "coverageReporters": [
    "cobertura",
    "html"
    ],
    "reporters": [ "default", "jest-junit" ],
    "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/generated/**/*.ts"
    ],
  }