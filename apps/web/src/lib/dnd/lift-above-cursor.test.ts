import { describe, expect, it } from "vitest";
import type { Modifier } from "@dnd-kit/core";
import { liftAboveCursor } from "./lift-above-cursor";

const lift = (transform: { x: number; y: number }, height?: number) =>
  liftAboveCursor({
    transform: { ...transform, scaleX: 1, scaleY: 1 },
    draggingNodeRect: height === undefined ? null : ({ height } as DOMRect),
  } as Parameters<Modifier>[0]);

describe("liftAboveCursor", () => {
  it("moves the overlay up by half its height plus a gap, and leaves x alone", () => {
    expect(lift({ x: 40, y: 300 }, 28)).toMatchObject({ x: 40, y: 300 - 14 - 22 });
  });

  it("still lifts by the gap when the overlay isn't measured yet", () => {
    expect(lift({ x: 0, y: 100 })).toMatchObject({ y: 78 });
  });
});
