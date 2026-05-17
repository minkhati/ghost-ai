import { SignIn } from "@clerk/nextjs";
import { AuthLeftPanel } from "@/components/auth/auth-left-panel";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-base flex">
      <AuthLeftPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <SignIn />
      </div>
    </div>
  );
}
