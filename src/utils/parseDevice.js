export const getDeviceOS = (platform = '') => {
  platform = platform.toLowerCase();

  if (platform.includes('win')) return 'Windows';
  if (platform.includes('mac')) return 'macOS';
  if (platform.includes('linux')) return 'Linux';
  if (platform.includes('android')) return 'Android';
  if (platform.includes('iphone') || platform.includes('ipad')) return 'iOS';

  return 'Other';
};