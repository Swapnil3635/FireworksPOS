import type { NextConfig } from "next";

// Portable: works on Vercel + Netlify + Cloudflare (static fallback).
// Note: @cloudflare/next-on-pages supports up to Next 15 — when deploying to
// Cloudflare Pages, either pin Next to 15.x or use Vercel/Netlify for Next 16.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
