import type { InstallPlatform } from "@/lib/pwa";

/** How one browser's "Add to Home Screen" flow looks, for the animated guide. */
export interface InstallGuide {
  /** Where the browser keeps its address bar and menu button. */
  toolbar: "top" | "bottom";
  menuIcon: "dots" | "kebab" | "share" | "burger";
  /** iOS opens a sheet from the bottom; Android drops a menu from the top. */
  menuStyle: "sheet" | "dropdown";
  menuItems: string[];
  target: string;
  confirm: { title: string; action: string; style: "ios" | "android" };
  steps: { text: string; detail?: string }[];
  /** Name of the menu button, for the step text and screen readers. */
  menuName: string;
}

const iosShareItems = ["Copy", "Add to Favorites", "Add to Home Screen", "Find on Page"];

const guides: Record<Exclude<InstallPlatform, "desktop">, InstallGuide> = {
  "ios-safari": {
    toolbar: "bottom",
    menuIcon: "dots",
    menuName: "···",
    menuStyle: "sheet",
    menuItems: iosShareItems,
    target: "Add to Home Screen",
    confirm: { title: "Add to Home Screen", action: "Add", style: "ios" },
    steps: [
      {
        text: "Tap ··· in Safari's toolbar",
        detail: "Then tap Share. On older iPhones, tap the Share button directly.",
      },
      { text: "Tap “Add to Home Screen”", detail: "Scroll the list down if you don't see it." },
      { text: "Tap “Add”", detail: "Open Sunsama lands on your Home Screen." },
    ],
  },
  "ios-chrome": {
    toolbar: "top",
    menuIcon: "share",
    menuName: "Share",
    menuStyle: "sheet",
    menuItems: iosShareItems,
    target: "Add to Home Screen",
    confirm: { title: "Add to Home Screen", action: "Add", style: "ios" },
    steps: [
      { text: "Tap Share in the address bar", detail: "The square with an arrow, top right." },
      { text: "Tap “Add to Home Screen”", detail: "Scroll the list down if you don't see it." },
      { text: "Tap “Add”", detail: "Open Sunsama lands on your Home Screen." },
    ],
  },
  "ios-other": {
    toolbar: "bottom",
    menuIcon: "share",
    menuName: "Share",
    menuStyle: "sheet",
    menuItems: iosShareItems,
    target: "Add to Home Screen",
    confirm: { title: "Add to Home Screen", action: "Add", style: "ios" },
    steps: [
      { text: "Tap Share in your browser", detail: "Or open this page in Safari." },
      { text: "Tap “Add to Home Screen”" },
      { text: "Tap “Add”", detail: "Open Sunsama lands on your Home Screen." },
    ],
  },
  "android-chrome": {
    toolbar: "top",
    menuIcon: "kebab",
    menuName: "⋮",
    menuStyle: "dropdown",
    menuItems: ["New tab", "History", "Bookmarks", "Add to Home screen", "Settings"],
    target: "Add to Home screen",
    confirm: { title: "Install app", action: "Install", style: "android" },
    steps: [
      { text: "Tap ⋮ at the top right", detail: "The three-dot menu next to the address bar." },
      { text: "Tap “Add to Home screen”", detail: "Some phones call it “Install app”." },
      { text: "Tap “Install”", detail: "Open Sunsama lands on your Home screen." },
    ],
  },
  "android-samsung": {
    toolbar: "bottom",
    menuIcon: "burger",
    menuName: "≡",
    menuStyle: "sheet",
    menuItems: ["Bookmarks", "History", "Add page to", "Settings"],
    target: "Add page to",
    confirm: { title: "Add to Home screen", action: "Add", style: "android" },
    steps: [
      { text: "Tap ≡ in the bottom bar" },
      { text: "Tap “Add page to” → “Home screen”" },
      { text: "Tap “Add”", detail: "Open Sunsama lands on your Home screen." },
    ],
  },
  "android-firefox": {
    toolbar: "top",
    menuIcon: "kebab",
    menuName: "⋮",
    menuStyle: "dropdown",
    menuItems: ["New tab", "History", "Bookmarks", "Add app to Home screen", "Settings"],
    target: "Add app to Home screen",
    confirm: { title: "Add to Home screen", action: "Add", style: "android" },
    steps: [
      { text: "Tap ⋮ next to the address bar" },
      { text: "Tap “Add app to Home screen”" },
      { text: "Tap “Add”", detail: "Open Sunsama lands on your Home screen." },
    ],
  },
  "android-other": {
    toolbar: "top",
    menuIcon: "kebab",
    menuName: "⋮",
    menuStyle: "dropdown",
    menuItems: ["New tab", "History", "Bookmarks", "Add to Home screen", "Settings"],
    target: "Add to Home screen",
    confirm: { title: "Add to Home screen", action: "Add", style: "android" },
    steps: [
      { text: "Open your browser's menu", detail: "Usually ⋮ or ≡ next to the address bar." },
      { text: "Tap “Add to Home screen”", detail: "Or “Install app”." },
      { text: "Confirm", detail: "Open Sunsama lands on your Home screen." },
    ],
  },
};

export function installGuideFor(platform: InstallPlatform): InstallGuide {
  // Desktop visitors (e.g. the More menu on a narrow window) see the iPhone flow.
  return platform === "desktop" ? guides["ios-safari"] : guides[platform];
}
