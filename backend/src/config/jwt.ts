const isProduction = process.env.NODE_ENV === "production";

function getValidatedJwtSecret(envVarName: string, devFallback: string): string {
  const secret = process.env[envVarName];
  if (isProduction) {
    if (!secret || secret.trim().length === 0) {
      throw new Error(`FATAL: ${envVarName} must be configured in production environment.`);
    }
    if (secret.trim().length < 32) {
      throw new Error(`FATAL: ${envVarName} in production must be at least 32 characters long.`);
    }
    return secret.trim();
  }

  if (!secret) {
    return devFallback;
  }
  return secret.trim();
}

export const JWT_SECRET = getValidatedJwtSecret("JWT_SECRET", "super-secret-key-frontend-arena-dev-only");
export const JWT_REFRESH_SECRET = getValidatedJwtSecret("JWT_REFRESH_SECRET", "super-refresh-key-frontend-arena-dev-only");
