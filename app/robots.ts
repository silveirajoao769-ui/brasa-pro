import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots {
  // Preview/prelaunch: disable indexing until reviewed production release.
  return {rules:[{userAgent:"*",disallow:"/"}]};
}
