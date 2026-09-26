import { describe, expect, it } from "vitest";
import { detectInstallPlatform } from "./pwa";

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/140.0 Mobile/15E148 Safari/605.1.15",
  ipadOS:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

describe("detectInstallPlatform", () => {
  it("tells the iPhone browsers apart", () => {
    expect(detectInstallPlatform(UA.iphoneSafari)).toBe("ios-safari");
    expect(detectInstallPlatform(UA.iphoneChrome)).toBe("ios-chrome");
    expect(detectInstallPlatform(UA.iphoneFirefox)).toBe("ios-other");
  });

  it("treats an iPad (Mac user agent with touch) as iOS", () => {
    expect(detectInstallPlatform(UA.ipadOS, 5)).toBe("ios-safari");
    expect(detectInstallPlatform(UA.ipadOS, 0)).toBe("desktop");
  });

  it("tells the Android browsers apart", () => {
    expect(detectInstallPlatform(UA.androidChrome)).toBe("android-chrome");
    expect(detectInstallPlatform(UA.samsung)).toBe("android-samsung");
    expect(detectInstallPlatform(UA.androidFirefox)).toBe("android-firefox");
  });

  it("calls everything else desktop", () => {
    expect(detectInstallPlatform(UA.macChrome)).toBe("desktop");
  });
});
