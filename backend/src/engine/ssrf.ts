import * as dns from "dns";
import * as net from "net";

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * multicast, unspecified, or reserved network spaces (SSRF protection).
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    const ipv4Part = ip.substring(7);
    if (net.isIPv4(ipv4Part)) {
      return isPrivateOrReservedIp(ipv4Part);
    }
  }

  const isV4 = net.isIPv4(ip);
  const isV6 = net.isIPv6(ip);

  if (!isV4 && !isV6) return true; // Invalid format is untrusted

  if (isV4) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Broadcast/Current network)
    if (a === 0) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 10.0.0.0/8 (RFC1918 Private)
    if (a === 10) return true;

    // 172.16.0.0/12 (RFC1918 Private: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (RFC1918 Private)
    if (a === 192 && b === 168) return true;

    // 169.254.0.0/16 (Link-Local / Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 100.64.0.0/10 (Shared Address Space / CGNAT: 100.64.0.0 - 100.127.255.255)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;

    // 198.18.0.0/15 (Benchmarking: 198.18.0.0 - 198.19.255.255)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future Use)
    if (a >= 240) return true;

    // 255.255.255.255/32 (Limited Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;

    return false;
  }

  if (isV6) {
    const lower = ip.toLowerCase();

    // Unspecified :: and Loopback ::1
    if (lower === "::" || lower === "::1" || lower === "0:0:0:0:0:0:0:0" || lower === "0:0:0:0:0:0:0:1") {
      return true;
    }

    // Unique Local Addresses fc00::/7 (fc00:: - fdff::)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

    // Link-Local Addresses fe80::/10 (fe80:: - febf::)
    if (
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    ) {
      return true;
    }

    // Multicast ff00::/8
    if (lower.startsWith("ff")) return true;

    return false;
  }

  return true;
}

/**
 * Validates untrusted deployment URLs against SSRF vectors (DNS resolution, private/loopback IP detection, scheme validation).
 * Throws Error with safe generic message if validation fails.
 */
export async function validateDeploymentUrlSSRF(urlStr: string): Promise<void> {
  const trimmed = (urlStr || "").trim();
  if (!trimmed) return;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid deployment URL format.");
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS deployment URLs are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Reject obvious loopback / internal domain names and wildcard DNS services
  const blockedHostPatterns = [
    "localhost",
    ".local",
    ".internal",
    ".localhost",
    "localtest.me",
    ".nip.io",
    ".sslip.io",
    ".xip.io",
    "0.0.0.0",
  ];

  if (
    blockedHostPatterns.some(
      (pattern) => hostname === pattern || hostname.endsWith(pattern)
    )
  ) {
    throw new Error("Private network URLs are restricted.");
  }

  // 3. If hostname is already a raw IP literal, validate directly
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error("Private network URLs are restricted.");
    }
    return;
  }

  // 4. Resolve DNS and validate all resolved IP addresses
  try {
    const records = await dns.promises.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new Error("Could not resolve deployment URL domain name.");
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new Error("Private network URLs are restricted.");
      }
    }
  } catch (err: any) {
    if (err.message === "Private network URLs are restricted.") {
      throw err;
    }
    // DNS resolution failure
    throw new Error("Deployment URL hostname could not be resolved.");
  }
}
