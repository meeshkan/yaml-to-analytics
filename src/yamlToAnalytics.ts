import fs from "fs";
import globSync from "glob";
import yaml from "js-yaml";
import { compileFromFile } from "json-schema-to-typescript";
import clonedeep from "lodash/clonedeep";
import { dirname, extname, isAbsolute, join, resolve } from "path";
import tmp from "tmp";
import TopologicalSort from "topological-sort";
import { promisify } from "util";

const glob = promisify(globSync);

const resolveTraverser = (inDir: string, json: any) => {
    for (const key of Object.keys(json)) {
        const val = json[key];
        if (val instanceof Array) {
            for (const item of val) {
                resolveTraverser(inDir, item);
            }
        } else if (typeof val === "object") {
            resolveTraverser(inDir, val);
        } else if (key === "$ref") {
            if (!isAbsolute(json[key])) {
                json[key] = join(inDir, json[key]);
            }
            json[key] = resolve(json[key]);
        }
    }
};

export const resolveReferencePaths = (inDir: string, json: any) => {
    const out = clonedeep(json);
    resolveTraverser(inDir, out);
    return out;
};

const traverseJsonForRefs = (refs: string[], json: any) => {
    for (const key of Object.keys(json)) {
        const val = json[key];
        if (val instanceof Array) {
            for (const item of val) {
                traverseJsonForRefs(refs, item);
            }
        } else if (typeof val === "object") {
            traverseJsonForRefs(refs, val);
        } else if (key === "$ref") {
            refs.push(json[key]);
        }
    }
};

export const getRefs = (json: any) => {
    const refs: string[] = [];
    traverseJsonForRefs(refs, json);
    return refs;
};

const resolveSubstitutes = (substitutes: any, json: any) => {
    for (const key of Object.keys(json)) {
        const val = json[key];
        if (val instanceof Array) {
            for (const item of val) {
                resolveSubstitutes(substitutes, item);
            }
        } else if (typeof val === "object") {
            resolveSubstitutes(substitutes, val);
        } else if (key === "$ref") {
            json[key] = substitutes[json[key]];
        }
    }
};

const capNoSpace = (s: string) => s.split(" ").map((lower) => lower.replace(/^\w/, (c) => c.toUpperCase())).join("");

export const substituteRefs = (json: any, substitutes: any) => {
    const out = clonedeep(json);
    resolveSubstitutes(substitutes, out);
    return out;
};

export default async (inDir: string, outFile: string) => {
    const yamlFilez = await glob(inDir);
    // returns dictionary of kv pairs
    // with key = json file name and value = contents
    // all of the refs are changed to absolute paths
    const jsonz = yamlFilez
        .map((yamlFile) => (
            {
                [yamlFile]:
                    resolveReferencePaths(dirname(yamlFile), yaml.safeLoad(fs.readFileSync(yamlFile, "utf8"))),
            }))
        .reduce((a, b) => ({ ...a, ...b }), {});
    // does a topological sort of the keys so that base types
    // will always come first
    const titlez = Object.keys(jsonz).map((key) => jsonz[key].title);
    if (new Set(titlez).size !== titlez.length) {
        throw Error("cannot have duplicate titles in the JSON schema");
    }
    const sortOp = new TopologicalSort(new Map<string, boolean>());
    for (const key of Object.keys(jsonz)) {
        sortOp.addNode(key, true);
    }
    const edges = Object.keys(jsonz)
            .map((key) => ({[key]: getRefs(jsonz[key])}))
            .reduce((a, b) => ({...a, ...b }), {});
    for (const key of Object.keys(edges)) {
        for (const dest of edges[key]) {
            sortOp.addEdge(key, dest);
        }
    }
    const sorted = sortOp.sort();
    const sortedKeys = [...sorted.keys()].reverse();
    const keysToTmpFiles = sortedKeys
        .map((key) => ({[key]: tmp.fileSync()}))
        .reduce((a, b) => ({...a, ...b}), {});
    const keysToTmpFileNames = sortedKeys
        .map((key) => ({[key]: keysToTmpFiles[key].name}))
        .reduce((a, b) => ({...a, ...b}), {});
    const jsonzWithSubstituteRefs = substituteRefs(jsonz, keysToTmpFileNames);
    // write json to temporary files for conversion
    for (const key of Object.keys(jsonzWithSubstituteRefs)) {
        fs.writeSync(keysToTmpFiles[key].fd, JSON.stringify(jsonzWithSubstituteRefs[key]));
    }
    const tss = await Promise.all(sortedKeys.map((key) => compileFromFile(keysToTmpFileNames[key], {
        bannerComment: "",
        declareExternallyReferenced: false,
    })));
    const file = ["/* tslint:disable */"]
        .concat(tss)
        .concat(Object.keys(jsonzWithSubstituteRefs)
            .map((key) => jsonzWithSubstituteRefs[key].title)
            .map((title) =>
`export const make${capNoSpace(title)} = (userId: string, properties: ${capNoSpace(title)}) => ({
    userId,
    event: "${title}",
    properties,
});
`));
    fs.writeFileSync(outFile, file.join("\n"));
};
