"use client";

import * as React from "react";
import { Suspense } from "react";
import { OtpVerificationForm } from "@/components/otp-verification-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Book } from "lucide-react";

function VerifyContent() {
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const email = searchParams.get("email") || "";

  React.useEffect(() => {
    if (!email) {
      router.push("/auth/sign-up");
    }
  }, [email, router]);

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;
    } catch (err: any) {
      throw new Error(err.message || "Failed to resend code");
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-2xl">Lumina</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <OtpVerificationForm
            email={email}
            onVerify={handleVerify}
            onResend={handleResend}
            error={error}
            isLoading={isLoading}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/auth/sign-in" className="hover:text-foreground transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
