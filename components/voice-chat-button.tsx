"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useVoiceChat, type VoiceChatStatus } from "@/hooks/use-voice-chat";
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceChatButtonProps {
  onUserTranscript?: (text: string) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void | Promise<void>;
  triggerContainer?: HTMLElement | null;
  disabled?: boolean;
  className?: string;
}

const statusLabels: Record<VoiceChatStatus, string> = {
  idle: "Start voice chat",
  connecting: "Connecting...",
  connected: "Connected",
  listening: "Listening...",
  processing: "Processing...",
  speaking: "AI speaking...",
  error: "Error occurred",
};

const statusColors: Record<VoiceChatStatus, string> = {
  idle: "bg-primary hover:bg-primary/90",
  connecting: "bg-yellow-500",
  connected: "bg-green-500",
  listening: "bg-green-500",
  processing: "bg-blue-500",
  speaking: "bg-purple-500",
  error: "bg-destructive",
};

export function VoiceChatButton({
  onUserTranscript,
  onAIResponse,
  onError,
  onStart,
  triggerContainer,
  disabled,
  className,
}: VoiceChatButtonProps) {
  const [showPanel, setShowPanel] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [buttonContainer, setButtonContainer] = React.useState<HTMLElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setButtonContainer(triggerContainer ?? null);
  }, [triggerContainer]);
  
  const { status, isActive, start, stop, analyserNode } = useVoiceChat({
    onTranscript: (text, isFinal) => {
      if (isFinal && text) {
        onUserTranscript?.(text);
      }
    },
    onAIResponse: (text) => {
      onAIResponse?.(text);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleToggle = async () => {
    if (isActive) {
      stop();
      setShowPanel(false);
    } else {
      setShowPanel(true);
      // Call onStart first to let parent prepare (e.g., create thread)
      await onStart?.();
      await start();
    }
  };

  const handleClose = () => {
    stop();
    setShowPanel(false);
  };

  // Visualizer Effect
  React.useEffect(() => {
    if (!showPanel || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = average / 255; // 0 to 1

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Base radius
      const baseRadius = Math.min(width, height) / 12;
      
      // Dynamic radius based on volume
      // Scale factor can be adjusted for sensitivity
      const scale = 1 + (volume * 0.8); 

      // Colors from the image (Sage/Beige tones)
      const centerColor = "#C8D0BA"; 
      const middleColor = "rgba(215, 225, 200, 0.5)"; 
      const outerColor = "rgba(230, 240, 220, 0.2)"; 

      // Draw Outer Circle (Largest, faintest)
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 3.5 * (1 + volume * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = outerColor;
      ctx.fill();

      // Draw Middle Circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2 * (1 + volume * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = middleColor;
      ctx.fill();

      // Draw Center Circle (Solid)
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * scale, 0, Math.PI * 2);
      ctx.fillStyle = centerColor;
      ctx.fill();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showPanel, analyserNode, status]);

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "rounded-xl h-10 w-10 transition-all",
        isActive && "bg-green-500/20 text-green-500 hover:bg-green-500/30",
        className
      )}
      title={statusLabels[status]}
    >
      {isActive ? (
        <Phone className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );

  return (
    <>
      {buttonContainer ? createPortal(triggerButton, buttonContainer) : null}

      {/* Full Screen Voice Chat Overlay */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
            >
              {/* Visualizer Canvas */}
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Content Overlay */}
              <div className="relative z-10 flex flex-col items-center justify-between h-full py-20 pointer-events-none">
                
                {/* Header / Status */}
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Voice Chat</h2>
                  {/* <p className="text-xl text-muted-foreground font-medium">
                    {statusLabels[status]}
                  </p> */}
                </div>

                {/* Center Area (Visualizer is here) */}
                <div className="flex-1" />

                {/* Controls */}
                <div className="pointer-events-auto flex flex-col items-center gap-6">
                  {status === "listening" && (
                    <p className="text-muted-foreground animate-pulse">
                      Listening...
                    </p>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleClose}
                    className="rounded-full w-20 h-20 shadow-lg hover:scale-105 transition-transform bg-red-500 hover:bg-red-600 text-white"
                  >
                    <PhoneOff className="w-8 h-8" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// Memoize to prevent re-renders from parent state changes breaking the voice connection
export const MemoizedVoiceChatButton = React.memo(VoiceChatButton);
