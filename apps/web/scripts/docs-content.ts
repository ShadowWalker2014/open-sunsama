import fs from "node:fs";
import path from "node:path";
import type { DocMeta } from "../src/types/docs";
import { readMdxMetadata } from "./blog-content";

const DOCS_DIR = path.resolve(import.meta.dir, "../src/content/docs");

function listMdx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? listMdx(file) : entry.name.endsWith(".mdx") ? [file] : [];
  });
}

export function readDocs() {
  return listMdx(DOCS_DIR).map((file) => {
    const source = fs.readFileSync(file, "utf8");
    const meta = readMdxMetadata<DocMeta>(source, file);
    const slug = path.relative(DOCS_DIR, file).replace(/\.mdx$/, "").replace(/\/index$/, "");
    return { file, source, slug, meta };
  });
}
