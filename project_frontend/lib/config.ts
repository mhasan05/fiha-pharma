// Central runtime config sourced from environment variables.
// Set these in .env.local (and your deployment env). The fallbacks keep the
// app working if the vars are not provided.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.bdmpharmacy.store";

// Images are served from the API host by default.
export const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_URL || API_BASE_URL;
