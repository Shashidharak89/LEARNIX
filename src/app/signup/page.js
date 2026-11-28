import { redirect } from "next/navigation";

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const requestedRedirect = typeof params?.redirect === "string" ? params.redirect : "";
  const safeRedirect = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "";
  redirect(safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : "/login");
}
