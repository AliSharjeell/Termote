import type { MetadataRoute } from "next"

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: "https://termote.vercel.app/sitemap.xml",
    host: "https://termote.vercel.app",
  }
}