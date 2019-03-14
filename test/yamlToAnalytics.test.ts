import fs from "fs";
import randomstring from "randomstring";
import ymlFilesToTypeFile, {
  buildFileContents, getRefs, resolveReferencePaths, substituteRefs } from "../src/yamlToAnalytics";

test("resolveReferencePaths", () => {
  expect(resolveReferencePaths("/foo/bar", {
    $ref: "q.json",
    a: 1,
    b: [{
      c: {
        $ref: "z.json",
      },
    }],
  })).toEqual({
    $ref: "/foo/bar/q.json",
    a: 1,
    b: [{
      c: {
        $ref: "/foo/bar/z.json",
      },
    }],
  });
});

test("getRefs", () => {
  expect(getRefs({
    $ref: "q.json",
    a: 1,
    b: [{
      c: {
        $ref: "z.json",
      },
    }],
  })).toEqual(expect.arrayContaining([
    "q.json",
    "z.json",
  ]));
});

test("substituteRefs", () => {
  expect(substituteRefs({
    $ref: "q.json",
    a: 1,
    b: [{
      c: {
        $ref: "z.json",
      },
    }],
  }, {
    "q.json": "foo",
    "z.json": "bar",
  })).toEqual({
    $ref: "foo",
    a: 1,
    b: [{
      c: {
        $ref: "bar",
      },
    }],
  });
});

const SCHEMAS: any = {
  BaseType: `title: BaseType
type: object
properties:
  eventName:
    type: string
additionalProperties: false
required:
- eventName
`,

Post: `title: sends a post
type: object
properties:
  title:
    type: string
  content:
    type: string
extends:
  $ref: './BaseType.yml'
additionalProperties: false
required:
- title
- content
`,
User: `title: registers a user
type: object
properties:
  firstName:
    type: string
  lastName:
    type: string
  age:
    description: Age in years
    type: integer
    minimum: 0
  hairColor:
    enum:
    - black
    - brown
    - blue
    type: string
extends:
  $ref: './BaseType.yml'
additionalProperties: false
required:
- firstName
- lastName
`,
};

const PARENT_DIR = ".m33$hk4n_y4ml";

const buildYamlAndTsDirs = () => {
  if (!fs.existsSync(`/tmp/${PARENT_DIR}`)) {
    fs.mkdirSync(`/tmp/${PARENT_DIR}`);
  }
  const dir = randomstring.generate();
  fs.mkdirSync(`/tmp/${PARENT_DIR}/${dir}`);
  const yamlDir = `/tmp/${PARENT_DIR}/${dir}/yaml`;
  const tsDir = `/tmp/${PARENT_DIR}/${dir}/ts`;
  fs.mkdirSync(yamlDir);
  fs.mkdirSync(tsDir);
  for (const SCHEMA of Object.keys(SCHEMAS)) {
    const yamlFile = `${yamlDir}/${SCHEMA}.yml`;
    fs.writeFileSync(yamlFile, SCHEMAS[SCHEMA]);
  }
  return [yamlDir, tsDir];
};

test("ts json to make correct type file", async () => {
  const [yamlDir, tsDir] = buildYamlAndTsDirs();
  const targetTs = `${tsDir}/index.ts`;
  await ymlFilesToTypeFile(`${yamlDir}/**/*.yml`, targetTs);
  const analyticsModule = await import(tsDir);
  const registersAUserEvent = analyticsModule.makeRegistersAUser("foobar", {});
  expect(registersAUserEvent.userId).toBe("foobar");
});
