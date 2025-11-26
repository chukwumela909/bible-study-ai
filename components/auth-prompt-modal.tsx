"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthPromptModal({ isOpen, onClose, message = "Sign in to continue" }: AuthPromptModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    Authentication Required
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {message}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link href="/auth/sign-up" className="w-full">
                  <Button size="lg" className="w-full">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/auth/sign-in" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-2">
                Create a free account to unlock AI-powered Bible study features
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
