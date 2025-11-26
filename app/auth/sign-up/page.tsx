"use client";

import * as React from "react";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Book } from "lucide-react";

export default function SignUpPage() {
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Redirect to verification page instead of home
      if (data.user && !data.session) {
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
      } else {
        // If email confirmation is disabled, redirect to home
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
            Create an account
          </h1>
          <p className="text-muted-foreground">
            Start your journey with AI-powered Bible study
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <AuthForm
            mode="sign-up"
            onSubmit={handleSignUp}
            error={error}
            isLoading={isLoading}
          />

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/auth/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
