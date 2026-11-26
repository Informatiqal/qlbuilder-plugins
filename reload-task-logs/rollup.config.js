import del from "rollup-plugin-delete";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { readFileSync } from "fs";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const pkg = JSON.parse(readFileSync("./package.json"));

export default {
    input: "src/index.js",
    output: {
        file: "dist/index.js",
        format: "es",
        sourcemap: process.env.NODE_ENV == "prod" ? true : false,
    },
    external: ["fs", "os", "https", "readline"],
    plugins: [
        del({
            targets: "dist/*",
        }),
        replace({
            values: {
                __VERSION: pkg.version,
            },
            preventAssignment: true,
        }),
        json(),
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs(),
    ],
};
