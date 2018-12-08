#!/usr/bin/env node
import yamlFilesToAnalytics from "./yamlToAnalytics";

const [, , inDir, outFile] = process.argv;
yamlFilesToAnalytics(inDir, outFile);
