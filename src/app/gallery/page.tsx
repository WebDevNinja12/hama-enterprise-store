import { redirect } from "next/navigation";

/** Gallery lives on the main company website, not the shop. */
export default function GalleryRedirectPage() {
  redirect("https://hama-enterprise-ng.vercel.app/gallery.html");
}
