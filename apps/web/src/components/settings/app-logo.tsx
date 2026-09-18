import * as React from "react";
import { cn } from "@/lib/utils";

/** An OAuth client's logo, falling back to its initial when missing or broken. */
export function AppLogo({ name, logoUri, className, imageClassName }: {
  name: string;
  logoUri: string | null;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background",
        className
      )}
    >
      {logoUri && !failed ? (
        <img src={logoUri} alt="" className={cn("object-contain", imageClassName)} onError={() => setFailed(true)} />
      ) : (
        <span className="text-sm font-semibold">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
