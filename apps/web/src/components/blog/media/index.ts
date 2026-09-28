import { createElement, type ComponentProps } from "react";
import { Shot } from "./shot";
import { Clip } from "./clip";
import { DemoVideo } from "./demo-video";
import { OssApp } from "./oss-app";
import { OssTable } from "./oss-table";

export { Shot, Clip, DemoVideo, OssApp, OssTable };
export { OssListProvider } from "./oss-list";

/** Markdown tables scroll inside their own box, so wide ones never push the page sideways on phones. */
function Table(props: ComponentProps<"table">) {
  return createElement("div", { className: "table-wrapper" }, createElement("table", props));
}

/** Components every blog post can use without an import line. */
export const blogMdxComponents = { Shot, Clip, DemoVideo, OssApp, OssTable, table: Table };
