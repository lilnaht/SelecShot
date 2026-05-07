import { Suspense } from "react";

import { AuthForm } from "@/components/shared/auth-form";
import { SiteLogo } from "@/components/shared/site-logo";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full flex-col items-center gap-8">
        <SiteLogo />
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </main>
  );
}
