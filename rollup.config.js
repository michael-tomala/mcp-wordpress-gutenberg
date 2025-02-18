import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
    input: "src/index.ts",
    output: {
        file: "dist/index.js",
        format: "esm", // Używamy ESM, aby działało z "type": "module"
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs(),
        json(),
        typescript({
            tsconfig: "./tsconfig.json",
        }),
    ],
    external: ["fs", "path", "process"], // Nie bundlujemy wbudowanych modułów Node.js
};
