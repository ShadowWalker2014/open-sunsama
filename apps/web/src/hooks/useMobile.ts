import { useEffect, useState, useCallback } from 'react';
import { 
  isTauriMobile, 
  getPlatform, 
  triggerHaptic as doTriggerHaptic,
  requestNotificationPermission as doRequestNotificationPermission,
  setBadgeCount as doSetBadgeCount,
  type HapticType,
  type Platform,
} from '@/lib/mobile';

interface UseMobileReturn {
  /** Whether running on Tauri mobile (iOS/Android) */
  isMobile: boolean;
  /** Whether we're still checking the platform */
  isLoading: boolean;
  /** Current platform: 'ios' | 'android' | 'desktop' | 'web' */
  platform: Platform;
  /** Trigger haptic feedback (only works on mobile) */
  triggerHaptic: (type: HapticType) => Promise<void>;
  /** Request notification permission */
  requestNotificationPermission: () => Promise<boolean>;
  /** Set app badge count (iOS only) */
  setBadgeCount: (count: number) => Promise<void>;
}

/**
 * Hook for accessing mobile-specific features
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, triggerHaptic, platform } = useMobile();
 *   
 *   const handlePress = async () => {
 *     await triggerHaptic('light');
 *     // do something
 *   };
 *   
 *   return (
 *     <button onClick={handlePress}>
 *       {isMobile ? 'Tap me' : 'Click me'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useMobile(): UseMobileReturn {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    async function detectPlatform() {
      try {
        const [mobile, plat] = await Promise.all([
          isTauriMobile(),
          getPlatform(),
        ]);
        setIsMobile(mobile);
        setPlatform(plat);
      } catch {
        setIsMobile(false);
        setPlatform('web');
      } finally {
        setIsLoading(false);
      }
    }

    detectPlatform();
  }, []);

  const triggerHaptic = useCallback(async (type: HapticType) => {
    if (isMobile) {
      await doTriggerHaptic(type);
    }
  }, [isMobile]);

  const requestNotificationPermission = useCallback(async () => {
    return doRequestNotificationPermission();
  }, []);

  const setBadgeCount = useCallback(async (count: number) => {
    if (isMobile) {
      await doSetBadgeCount(count);
    }
  }, [isMobile]);

  return {
    isMobile,
    isLoading,
    platform,
    triggerHaptic,
    requestNotificationPermission,
    setBadgeCount,
  };
}
