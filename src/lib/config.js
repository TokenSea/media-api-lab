/**
 * Centralized configuration for the SaaS template.
 * All environment variables are validated and exported from here.
 */

const config = {
  db: {
    url: process.env.DATABASE_URL,
  }
};

// Simple validation to warn if critical keys are missing
const requiredKeys = [
  ["DATABASE_URL", config.db.url],
];

if (typeof window === "undefined") {
  requiredKeys.forEach(([name, value]) => {
    if (!value) {
      console.warn(`[CONFIG] Warning: Missing critical environment variable: ${name}`);
    }
  });
}

export default config;
