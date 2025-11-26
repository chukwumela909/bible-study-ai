"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Book } from "lucide-react";

export default function AuthCodeErrorPage() {
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

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Verification Failed
              </h2>
              <p className="text-sm text-muted-foreground">
                The verification link is invalid or has expired. This could happen if the link was already used or if it's more than an hour old.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/auth/sign-in" className="block">
              <Button className="w-full" size="lg">
                Go to Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
