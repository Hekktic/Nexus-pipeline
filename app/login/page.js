import CenteredScreen from "@/components/CenteredScreen";
import LoginForm from "@/components/LoginForm";
import SetupNotice from "@/components/SetupNotice";
import { hasAppPassword } from "@/lib/session";

export default async function LoginPage() {
  return <CenteredScreen>{hasAppPassword ? <LoginForm /> : <SetupNotice />}</CenteredScreen>;
}
