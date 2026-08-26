import LoginForm from "@/components/LoginForm";
import SetupNotice from "@/components/SetupNotice";
import { hasAppPassword } from "@/lib/session";

export default async function LoginPage() {
  if (!hasAppPassword) return <SetupNotice />;

  return <LoginForm />;
}
