import { Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/motion";
import { BrowserFrame, ThemedShot } from "@/components/landing/product-shot";
import { cn } from "@/lib/utils";

/**
 * The home page's dark band, with the real board screenshot bleeding off the
 * edge. The `dark` class scopes dark tokens to the band in either site theme.
 */
export function BlogCTA({ className }: { className?: string }) {
  return (
    <section className={cn("py-20 md:py-24", className)}>
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="dark relative overflow-hidden rounded-3xl border border-white/10 bg-[hsl(228_14%_7%)] text-foreground shadow-[0_32px_100px_-40px_hsl(24_95%_53%/0.5)]">
            <div className="landing-grid-dark pointer-events-none absolute inset-0 opacity-60" />
            <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,hsl(24_95%_60%/0.32),transparent)] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-[36rem] rounded-full bg-[radial-gradient(closest-side,hsl(24_95%_60%/0.22),transparent)] blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-6">
              <div className="min-w-0 px-7 pt-10 sm:px-10 sm:pt-12 lg:py-16 lg:pl-14 lg:pr-0">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[hsl(24_95%_60%)]">
                  Try Open Sunsama
                </p>
                <h2 className="mt-3 text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-white md:text-[40px]">
                  Your whole day, on one board.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60 md:text-[16px]">
                  Drag tasks onto your calendar, work one at a time in focus
                  mode, and let Claude or ChatGPT plan the rest. Open source,
                  and yours to self-host.
                </p>
                <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    size="lg"
                    className="h-11 rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(24_95%_53%/0.7)]"
                    asChild
                  >
                    <Link to="/register">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-lg border-white/15 bg-white/5 px-5 text-[14px] text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link to="/download">
                      <Download className="h-4 w-4" />
                      Download the app
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="min-w-0 pl-7 sm:pl-10 lg:pl-0">
                <div className="-mb-px translate-x-0 lg:-mr-2 lg:translate-y-10">
                  <BrowserFrame className="rounded-b-none rounded-r-none border-b-0 border-r-0 sm:rounded-tr-none">
                    <div className="aspect-[16/10] w-full overflow-hidden">
                      <ThemedShot
                        name="board"
                        alt="The Open Sunsama board: today's tasks beside a time-blocked calendar"
                      />
                    </div>
                  </BrowserFrame>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
