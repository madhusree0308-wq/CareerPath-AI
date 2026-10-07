const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || Buffer.byteLength(jwtSecret, "utf8") < 32) {
  throw new Error(
    "JWT_SECRET must be configured with at least 32 bytes of random data.",
  );
}

export const JWT_SECRET = jwtSecret;
export const JWT_ISSUER = "careerpath-api";
export const JWT_AUDIENCE = "careerpath-app";
export const JWT_EXPIRES_IN = "1h";
