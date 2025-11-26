"use client";

import * as React from "react";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Book } from "lucide-react";

export default function SignInPage() {
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <AuthForm
            mode="sign-in"
            onSubmit={handleSignIn}
            error={error}
            isLoading={isLoading}
          />

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              href="/auth/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
