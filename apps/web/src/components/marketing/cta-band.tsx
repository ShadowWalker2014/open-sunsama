import { Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/motion";
import { BrowserFrame } from "@/components/landing/product-shot";
import { BLOG_MEDIA } from "@/lib/blog-media";
import { cn } from "@/lib/utils";
import { CONTAINER, PRIMARY_CTA } from "./tokens";

/**
 * The closing call to action: the home page's dark band (grid, orange glow)
 * with a real product screenshot rising out of its bottom-right corner.
 */
export function CtaBand({
  heading,
  body,
  shot,
  shotAlt,
  className,
}: {
  heading: string;
  body: string;
  /** Shot id from blog-media.json; follows the site theme. */
  shot: string;
  shotAlt: string;
  className?: string;
}) {
  const image = BLOG_MEDIA.shots[shot];
  return (
    <section className={cn("border-t border-border/50 py-20 md:py-24", className)} aria-labelledby="cta-heading">
      <div className={CONTAINER}>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-[hsl(228_14%_7%)] text-[hsl(220_13%_93%)] shadow-[0_32px_100px_-40px_hsl(var(--shadow-color)/0.5)] dark:border-white/10">
            <div className="landing-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,hsl(24_95%_60%/0.38),transparent)] blur-2xl motion-safe:animate-[landing-drift_16s_ease-in-out_infinite]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-32 left-[20%] h-72 w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(244_63_94/0.18),transparent)] blur-2xl"
              aria-hidden
            />
            <div className="relative grid items-center gap-10 p-8 md:p-12 lg:grid-cols-[1fr_1.15fr] lg:gap-6 lg:p-14 lg:pr-0">
              <div className="min-w-0 lg:py-4">
                <img src="/open-sunsama-logo.png" alt="" className="h-11 w-11 rounded-xl shadow-lg" />
                <h2 id="cta-heading" className="mt-6 text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] md:text-[42px]">
                  {heading}
                </h2>
                <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/65">{body}</p>
                <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
                  <Button size="lg" className={cn(PRIMARY_CTA, "w-full sm:w-auto")} asChild>
                    <Link to="/register">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 w-full rounded-lg border-white/15 bg-white/5 px-5 text-[14px] text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    asChild
                  >
                    <Link to="/download">
                      <Download className="h-4 w-4" />
                      Download for desktop
                    </Link>
                  </Button>
                </div>
                <p className="mt-5 text-[12px] text-white/45">
                  Open source · Works with Claude, ChatGPT and any MCP client · Self-host any time
                </p>
              </div>
              {image && (
                <div className="relative min-w-0 lg:-mb-16 lg:translate-x-8 lg:self-end" aria-hidden={false}>
                  <BrowserFrame className="border-white/10 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.8)]">
                    <img
                      src={image.light}
                      alt={shotAlt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto w-full dark:hidden"
                    />
                    <img
                      src={image.dark}
                      alt={shotAlt}
                      width={image.width}
                      height={image.height}
                      loading="lazy"
                      decoding="async"
                      className="hidden h-auto w-full dark:block"
                    />
                  </BrowserFrame>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
