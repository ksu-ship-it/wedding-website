export function isSameOriginRequest(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!originHeader || !hostHeader) return false;

  try {
    const origin = new URL(originHeader);
    const expectedHost = hostHeader.split(",")[0].trim().toLowerCase();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const expectedProtocol = forwardedProtocol
      ? `${forwardedProtocol.replace(/:$/, "")}:`
      : new URL(request.url).protocol;

    return origin.host.toLowerCase() === expectedHost && origin.protocol === expectedProtocol;
  } catch {
    return false;
  }
}