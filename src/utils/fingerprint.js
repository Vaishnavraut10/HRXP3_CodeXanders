export async function fingerprintDevice() {
  const msg = navigator.userAgent + navigator.platform + navigator.vendor;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}