import * as React from "react";
import { Share, MoreHorizontal, MoreVertical, Menu, Plus, Copy, Star, Search, Clock, Bookmark, Settings, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InstallGuide } from "./install-guides";

/** Screen size inside the bezel, in CSS px. Everything below is laid out on it. */
const W = 188;
const H = 392;

/** iOS share sheet: 36px app row + 36px per menu row + padding. */
const SHEET_H = 204;

/** 0 tap menu · 1 tap "Add to Home Screen" · 2 confirm · 3 icon on Home Screen */
export type DemoPhase = 0 | 1 | 2 | 3;

interface PhoneDemoProps {
  guide: InstallGuide;
  phase: DemoPhase;
  /** Drawn at full size, then scaled; it's all DOM, so it stays sharp. */
  scale?: number;
  className?: string;
}

const menuIcons = {
  dots: MoreHorizontal,
  kebab: MoreVertical,
  share: Share,
  burger: Menu,
};

const rowIcons: Record<string, React.ElementType> = {
  Copy,
  "Add to Favorites": Star,
  "Find on Page": Search,
  History: Clock,
  Bookmarks: Bookmark,
  Settings,
  "New tab": Plus,
};

/**
 * A drawn phone that acts out the install flow for one browser: a finger
 * taps the menu button, then the "Add to Home Screen" row, then the confirm
 * button, and the Open Sunsama icon lands on the Home Screen.
 */
export function PhoneDemo({ guide, phase, scale = 1, className }: PhoneDemoProps) {
  const bottomBar = guide.toolbar === "bottom";
  const MenuIcon = menuIcons[guide.menuIcon];
  const targetIndex = Math.max(0, guide.menuItems.indexOf(guide.target));

  // Where each tap lands, per phase.
  const menuButton = bottomBar ? { x: W - 22, y: H - 24 } : { x: W - 20, y: 40 };
  const row =
    guide.menuStyle === "sheet"
      ? { x: W - 40, y: H - SHEET_H - 6 + 48 + targetIndex * 36 + 18 }
      : { x: W - 26, y: 60 + targetIndex * 30 + 15 };
  const confirm = guide.confirm.style === "ios" ? { x: W - 26, y: 46 } : { x: W - 50, y: 238 };
  const finger = phase === 0 ? menuButton : phase === 1 ? row : phase === 2 ? confirm : { x: W / 2, y: H + 40 };

  return (
    <div
      className={cn("relative shrink-0 select-none", className)}
      style={{ width: (W + 12) * scale, height: (H + 12) * scale }}
      aria-hidden
    >
    <div
      className="absolute left-0 top-0 origin-top-left"
      style={{ width: W + 12, height: H + 12, transform: `scale(${scale})` }}
    >
      {/* Bezel */}
      <div className="absolute inset-0 rounded-[36px] bg-[#111214] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45),inset_0_0_0_1.5px_rgba(255,255,255,0.08)]" />
      {/* Side buttons */}
      <div className="absolute -left-[2px] top-[92px] h-[26px] w-[3px] rounded-l bg-[#2a2b2e]" />
      <div className="absolute -left-[2px] top-[128px] h-[44px] w-[3px] rounded-l bg-[#2a2b2e]" />
      <div className="absolute -right-[2px] top-[112px] h-[60px] w-[3px] rounded-r bg-[#2a2b2e]" />

      {/* Screen */}
      <div
        className="absolute left-[6px] top-[6px] overflow-hidden rounded-[30px] bg-white text-[#111214]"
        style={{ width: W, height: H }}
      >
        <StatusBar dark={phase === 3} />
        <div className="absolute left-1/2 top-[7px] z-30 h-[18px] w-[62px] -translate-x-1/2 rounded-full bg-black" />

        {/* Browser with the app open */}
        <div className={cn("absolute inset-0 transition-opacity duration-500", phase === 3 && "opacity-0")}>
          {!bottomBar && <AddressBar icon={<MenuIcon className="h-[13px] w-[13px]" />} top pressed={phase === 0} />}
          <MiniApp top={bottomBar ? 30 : 58} />
          {bottomBar && <AddressBar icon={<MenuIcon className="h-[13px] w-[13px]" />} pressed={phase === 0} />}

          {/* Dim behind menus and dialogs */}
          <div
            className={cn(
              "absolute inset-0 z-[15] bg-black/25 transition-opacity duration-300",
              phase === 1 || phase === 2 ? "opacity-100" : "opacity-0"
            )}
          />

          {guide.menuStyle === "sheet" ? (
            <div
              className="absolute inset-x-[6px] z-20 rounded-[18px] bg-[#f2f2f7] p-[6px] shadow-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ bottom: 6, height: SHEET_H, transform: phase === 1 ? "translateY(0)" : `translateY(${SHEET_H + 24}px)` }}
            >
              <div className="mb-[6px] flex h-[36px] items-center gap-[7px] rounded-[12px] bg-white px-[8px]">
                <AppIcon size={24} />
                <div className="leading-tight">
                  <div className="text-[9px] font-semibold">Open Sunsama</div>
                  <div className="text-[7.5px] text-black/45">opensunsama.com</div>
                </div>
              </div>
              <div className="overflow-hidden rounded-[12px] bg-white">
                {guide.menuItems.map((item, i) => {
                  const Icon = rowIcons[item] ?? SquarePlus;
                  const isTarget = i === targetIndex;
                  return (
                    <div
                      key={item}
                      className={cn(
                        "flex h-[36px] items-center justify-between border-b border-black/[0.06] px-[10px] text-[9.5px] last:border-0",
                        isTarget && phase === 1 && "animate-[demo-row-press_2400ms_ease-out]"
                      )}
                    >
                      <span className={cn(isTarget && "font-semibold")}>{item}</span>
                      <Icon className="h-[12px] w-[12px] text-black/60" strokeWidth={isTarget ? 2.4 : 2} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="absolute right-[6px] z-20 w-[146px] origin-top-right rounded-[10px] bg-white py-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition-all duration-300"
              style={{
                top: 52,
                opacity: phase === 1 ? 1 : 0,
                transform: phase === 1 ? "scale(1)" : "scale(0.85)",
              }}
            >
              {guide.menuItems.map((item, i) => {
                const Icon = rowIcons[item] ?? SquarePlus;
                const isTarget = i === targetIndex;
                return (
                  <div
                    key={item}
                    className={cn(
                      "flex h-[30px] items-center gap-[8px] whitespace-nowrap px-[10px] text-[9.5px]",
                      isTarget && phase === 1 && "animate-[demo-row-press_2400ms_ease-out]"
                    )}
                  >
                    <Icon className="h-[12px] w-[12px] text-black/55" strokeWidth={isTarget ? 2.4 : 2} />
                    <span className={cn(isTarget && "font-semibold")}>{item}</span>
                  </div>
                );
              })}
            </div>
          )}

          <ConfirmDialog guide={guide} show={phase === 2} />
        </div>

        <HomeScreen show={phase === 3} />

        {/* Finger */}
        <div
          className="absolute z-40 transition-all duration-700 ease-[cubic-bezier(0.45,0,0.2,1)]"
          style={{ left: finger.x, top: finger.y, opacity: phase === 3 ? 0 : 1 }}
        >
          <span
            key={phase}
            className="absolute left-0 top-0 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f97316] opacity-0 animate-[demo-tap-ring_2400ms_ease-out]"
          />
          <span
            key={`dot-${phase}`}
            className="absolute left-0 top-0 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.35)] ring-1 ring-black/10 backdrop-blur animate-[demo-tap_2400ms_ease-in-out]"
          />
        </div>
      </div>
    </div>
    </div>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-30 flex h-[30px] items-center justify-between px-[20px] text-[9px] font-semibold transition-colors duration-500",
        dark ? "text-white" : "text-black"
      )}
    >
      <span>9:41</span>
      <span className="flex items-center gap-[3px]">
        <span className="flex items-end gap-[1px]">
          {[3, 4.5, 6, 7.5].map((h) => (
            <span key={h} className="w-[2px] rounded-[0.5px] bg-current" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-[2px] h-[7px] w-[14px] rounded-[2.5px] border border-current p-[1px]">
          <span className="block h-full w-[70%] rounded-[1px] bg-current" />
        </span>
      </span>
    </div>
  );
}

function AddressBar({ icon, top, pressed }: { icon: React.ReactNode; top?: boolean; pressed: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 z-10 flex items-center gap-[6px] px-[10px]",
        top ? "top-[28px] h-[26px]" : "bottom-0 h-[48px] border-t border-black/[0.06] bg-[#f9f9fb]/95 pb-[12px] pt-[6px]"
      )}
    >
      <div className="flex h-[26px] flex-1 items-center justify-center rounded-full bg-black/[0.06] text-[8.5px] text-black/70">
        <span className="mr-[3px] text-[7px]">🔒</span>opensunsama.com
      </div>
      <div
        className={cn(
          "flex h-[24px] w-[24px] items-center justify-center rounded-full text-black/75 transition-colors",
          pressed && "animate-[demo-button-press_2400ms_ease-out]"
        )}
      >
        {icon}
      </div>
    </div>
  );
}

/** A tiny, recognisable Open Sunsama day view. */
function MiniApp({ top }: { top: number }) {
  return (
    <div className="absolute inset-x-0 px-[12px]" style={{ top }}>
      <div className="mt-[8px] text-[12px] font-bold tracking-tight">September</div>
      <div className="mt-[6px] grid grid-cols-7 gap-[2px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-[2px]">
            <span className="text-[6px] text-black/40">{d}</span>
            <span
              className={cn(
                "flex h-[16px] w-[16px] items-center justify-center rounded-full text-[7.5px] font-semibold",
                i === 4 ? "bg-[#f97316] text-white" : "text-black/80"
              )}
            >
              {21 + i}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-[10px] space-y-[6px]">
        {[
          { w: "70%", sub: 2, p: "bg-orange-100 text-orange-600", label: "P1" },
          { w: "55%", sub: 0, p: "bg-blue-50 text-blue-500", label: "P2" },
          { w: "62%", sub: 1, p: "bg-slate-100 text-slate-500", label: "P3" },
        ].map((card, i) => (
          <div key={i} className="rounded-[8px] border border-black/[0.07] p-[7px]">
            <div className="flex items-center gap-[5px]">
              <span className="h-[8px] w-[8px] rounded-full border border-black/30" />
              <span className="h-[5px] rounded-full bg-black/70" style={{ width: card.w }} />
            </div>
            <div className="ml-[13px] mt-[5px] flex gap-[3px]">
              <span className={cn("rounded-[3px] px-[3px] text-[5.5px] font-semibold", card.p)}>{card.label}</span>
            </div>
            {Array.from({ length: card.sub }, (_, j) => (
              <div key={j} className="ml-[13px] mt-[4px] flex items-center gap-[4px]">
                <span className="h-[5px] w-[5px] rounded-full border border-black/25" />
                <span className="h-[3.5px] w-[40%] rounded-full bg-black/25" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmDialog({ guide, show }: { guide: InstallGuide; show: boolean }) {
  if (guide.confirm.style === "ios") {
    // iOS: a sheet from the top with Cancel / Add in its title bar.
    return (
      <div
        className="absolute inset-x-0 top-0 z-20 rounded-b-[18px] bg-[#f2f2f7] pb-[12px] pt-[30px] shadow-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: show ? "translateY(0)" : "translateY(-110%)" }}
      >
        <div className="flex items-center justify-between px-[12px] text-[9.5px]">
          <span className="text-[#007aff]">Cancel</span>
          <span className="font-semibold">{guide.confirm.title}</span>
          <span className="font-semibold text-[#007aff]">{guide.confirm.action}</span>
        </div>
        <div className="mx-[10px] mt-[10px] flex items-center gap-[8px] rounded-[12px] bg-white p-[8px]">
          <AppIcon size={30} />
          <div className="leading-tight">
            <div className="text-[10px] font-medium">Open Sunsama</div>
            <div className="mt-[2px] text-[7.5px] text-black/40">opensunsama.com</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="absolute left-1/2 top-[150px] z-20 w-[156px] -translate-x-1/2 rounded-[18px] bg-white p-[12px] shadow-2xl transition-all duration-300"
      style={{ opacity: show ? 1 : 0, transform: `translateX(-50%) scale(${show ? 1 : 0.9})` }}
    >
      <div className="text-[11px] font-semibold">{guide.confirm.title}</div>
      <div className="mt-[10px] flex items-center gap-[8px]">
        <AppIcon size={28} />
        <div className="text-[9.5px]">Open Sunsama</div>
      </div>
      <div className="mt-[14px] flex justify-end gap-[14px] text-[9.5px] font-semibold text-[#1a73e8]">
        <span>Cancel</span>
        <span>{guide.confirm.action}</span>
      </div>
    </div>
  );
}

function HomeScreen({ show }: { show: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-500",
        show ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      style={{
        background:
          "radial-gradient(120% 80% at 20% 0%, #ffb37a 0%, #f97316 38%, #b93a7a 75%, #3b2a6b 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-[46px] grid grid-cols-4 gap-x-[14px] gap-y-[14px] px-[16px]">
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-[3px]">
            <div className="h-[32px] w-[32px] rounded-[9px] bg-white/25 ring-1 ring-white/15 backdrop-blur" />
            <div className="h-[3px] w-[22px] rounded-full bg-white/35" />
          </div>
        ))}
        <div className="flex flex-col items-center gap-[3px]">
          <div className={cn("rounded-[9px] shadow-lg", show && "animate-[demo-icon-pop_700ms_cubic-bezier(0.34,1.56,0.64,1)_300ms_both]")}>
            <AppIcon size={32} />
          </div>
          <div className="whitespace-nowrap text-[6.5px] font-medium text-white drop-shadow">Open Sunsama</div>
        </div>
      </div>
      {/* Dock */}
      <div className="absolute inset-x-[10px] bottom-[10px] flex h-[48px] items-center justify-around rounded-[20px] bg-white/25 backdrop-blur">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[32px] w-[32px] rounded-[9px] bg-white/35" />
        ))}
      </div>
    </div>
  );
}

function AppIcon({ size }: { size: number }) {
  return (
    <img
      src="/apple-touch-icon.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-[22%]"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
