import { redirect } from "next/navigation";

export default async function Page({ params }) {
  const { usn } = await params;
  redirect(`/users/${usn}`);
}
