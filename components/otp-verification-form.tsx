"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtpVerificationFormProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  error?: string;
  isLoading?: boolean;
}

export function OtpVerificationForm({
  email,
  onVerify,
  onResend,
  error,
  isLoading,
}: OtpVerificationFormProps) {
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [localError, setLocalError] = React.useState("");
  const [resending, setResending] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setLocalError("Please enter all 6 digits");
      return;
    }

    try {
      await onVerify(fullCode);
    } catch (err: any) {
      setLocalError(err.message || "Invalid verification code");
    }
  };

  const handleResend = async () => {
    setResending(true);
    setLocalError("");
    try {
      await onResend();
    } catch (err: any) {
      setLocalError(err.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Check your email
        </h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className={cn(
                "w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 bg-background",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary",
                "transition-all duration-200",
                digit ? "border-primary" : "border-input",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {(error || localError) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center">
            {error || localError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || code.join("").length !== 6}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || isLoading}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Didn't receive the code? Resend"}
          </button>
        </div>
      </div>
    </form>
  );
}
