export function parseUserAgent(ua: string | undefined) {
  if (!ua) return { os: 'Unknown', browser: 'Unknown', device: 'Desktop' };
  let os = 'Unknown';
  let browser = 'Unknown';
  let device = 'Desktop';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';

  if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
  else if (/edg/i.test(ua)) browser = 'Edge';

  if (/mobile|android|iphone|ipad|phone/i.test(ua)) device = 'Mobile';

  return { os, browser, device };
}
