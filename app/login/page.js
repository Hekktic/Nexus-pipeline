import LoginForm from "@/components/LoginForm";
import SetupNotice from "@/components/SetupNotice";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({ searchParams }) {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const params = await searchParams;
  return <LoginForm linkError={params?.error === "link"} />;
}
