import { readFileSync } from "fs";
import * as meta from "./package.json";

// Extract copyrights from the LICENSE.
const copyright = readFileSync("./LICENSE", "utf-8")
    .split(/\n/g)
    .filter(line => /^Copyright\s+/.test(line))
    .map(line => line.replace(/^Copyright\s+/, ""))
    .join(", ");

export default {
    input: "dist/src/index.js",
    output: {
        file: `dist/${meta.name}.js`,
        name: "ak",
        format: "umd",
        indent: false,
        extend: true,
        banner: `// v${meta.version} Copyright ${copyright}`
    },
};

