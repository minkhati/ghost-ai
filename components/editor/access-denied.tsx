import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <Lock className="h-10 w-10 text-copy-muted" />
        <h1 className="text-lg font-semibold text-copy-primary">Access Denied</h1>
        <p className="text-sm text-copy-muted max-w-sm">
          This project does not exist or you do not have permission to view it.
        </p>
        <Link href="/editor" className="text-sm text-brand hover:underline">
          Back to projects
        </Link>
      </div>
    </div>
  );
}
