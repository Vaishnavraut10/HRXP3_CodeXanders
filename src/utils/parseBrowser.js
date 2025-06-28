export const getBrowserName = (userAgent) => {
  userAgent = userAgent.toLowerCase();
  if (userAgent.includes('edg')) return 'Edge';
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
  if (userAgent.includes('firefox')) return 'Firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
  if (userAgent.includes('opera') || userAgent.includes('opr')) return 'Opera';
  return 'Other';
};