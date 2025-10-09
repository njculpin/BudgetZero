import { useAdminGetMe } from "@/lib/sdk/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await useAdminGetMe();
  if (user) {
    redirect("/dashboard");
  }
  return <div></div>;
}
