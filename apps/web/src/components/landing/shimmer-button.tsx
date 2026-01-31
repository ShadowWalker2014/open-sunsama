import React, { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "8px",
      background = "hsl(var(--primary))",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] dark:text-black",
          "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div
          className={cn(
            "-z-10 [radial-gradient(circle_at_50%_0%,_var(--shimmer-color)_0%,_transparent_50%)] [inset:0_calc(-1*var(--cut))]",
            "absolute inset-0 h-full w-full animate-shimmer [background:radial-gradient(circle_at_50%_0%,var(--shimmer-color)_0%,transparent_50%)] [background-size:100%_100%]",
          )}
        />

        {/* content */}
        {children}

        {/* backdrop */}
        <div
          className={cn(
            "absolute inset-[1px] -z-20 [background:var(--bg)] [border-radius:var(--radius)]",
          )}
        />
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
