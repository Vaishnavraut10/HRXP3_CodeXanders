export const checkDeviceSecurity = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  const isRooted = /magisk|rootcloak|xposed/.test(userAgent);
  const isOutdatedBrowser = !('credential' in navigator);
  const isEmulator = /nox|bluestacks|genymotion|virtualbox/.test(userAgent);
  const isInsecurePlatform = /(windows nt 5|windows xp|android 5|android 6)/.test(userAgent);

  const isSafe = !(isRooted || isOutdatedBrowser || isEmulator || isInsecurePlatform);

  return {
    isRooted,
    isOutdatedBrowser,
    isEmulator,
    isInsecurePlatform,
    isSafe,
    platform,
    userAgent,
  };
};