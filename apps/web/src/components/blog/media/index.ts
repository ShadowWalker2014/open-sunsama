import { createElement, type ComponentProps } from "react";
import { Shot } from "./shot";
import { Clip } from "./clip";
import { DemoVideo } from "./demo-video";

export { Shot, Clip, DemoVideo };

/** Markdown tables scroll inside their own box, so wide ones never push the page sideways on phones. */
function Table(props: ComponentProps<"table">) {
  return createElement("div", { className: "table-wrapper" }, createElement("table", props));
}

/** Components every blog post can use without an import line. */
export const blogMdxComponents = { Shot, Clip, DemoVideo, table: Table };
