// Screen wake lock utility to prevent iPad / phone from sleeping during stream
export class WakeLockManager {
  private static wakeLock: WakeLockSentinel | null = null;
  private static isRequested: boolean = false;

  public static async request(): Promise<boolean> {
    this.isRequested = true;
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          // Re-acquire if still requested when visibility changes
          if (this.isRequested && document.visibilityState === 'visible') {
            this.request();
          }
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public static release(): void {
    this.isRequested = false;
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  public static isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }
}
