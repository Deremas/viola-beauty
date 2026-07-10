export const siteName = "Viola Brows and Beauty";
export const siteDescription =
  "Book brow, lash, lip, and beauty appointments online with Viola Brows and Beauty. Choose an available time, upload advance payment proof, and wait for confirmation.";

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
