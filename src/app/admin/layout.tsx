import { cookies } from "next/headers";
import LoginForm from "./LoginForm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token || token.value !== "secret123") {
    return <LoginForm />;
  }

  return <>{children}</>;
}
