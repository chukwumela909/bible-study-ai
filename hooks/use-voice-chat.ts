"use client";

import * as React from "react";

interface UseVoiceChatOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: VoiceChatStatus) => void;
}

export type VoiceChatStatus = 
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const { onTranscript, onAIResponse, onError, onStatusChange } = options;
  
  const [status, setStatus] = React.useState<VoiceChatStatus>("idle");
  const [isActive, setIsActive] = React.useState(false);
  const [analyserNode, setAnalyserNode] = React.useState<AnalyserNode | null>(null);
  
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = React.useRef<RTCDataChannel | null>(null);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  
  const userTranscriptRef = React.useRef<string>("");
  const aiTranscriptRef = React.useRef<string>("");

  // Store callbacks in refs to avoid recreating handlers when callbacks change
  const onTranscriptRef = React.useRef(onTranscript);
  const onAIResponseRef = React.useRef(onAIResponse);
  const onErrorRef = React.useRef(onError);
  const onStatusChangeRef = React.useRef(onStatusChange);

  // Keep refs updated
  React.useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onAIResponseRef.current = onAIResponse;
    onErrorRef.current = onError;
    onStatusChangeRef.current = onStatusChange;
  }, [onTranscript, onAIResponse, onError, onStatusChange]);

  const updateStatus = React.useCallback((newStatus: VoiceChatStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  const cleanup = React.useCallback(() => {
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAnalyserNode(null);
    
    setIsActive(false);
    updateStatus("idle");
  }, [updateStatus]);

  const start = React.useCallback(async () => {
    try {
      updateStatus("connecting");

      // Initialize Audio Context and Analyser
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
      
      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
      });
      
      if (!tokenResponse.ok) {
        throw new Error("Failed to get voice session token");
      }
      
      const { client_secret } = await tokenResponse.json();
      
      // Request microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      mediaStreamRef.current = mediaStream;

      // Connect Microphone to Analyser
      const source = ctx.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      
      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Set up audio element for AI responses
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      // Handle incoming audio from AI
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        updateStatus("connected");

        // Connect Remote Stream to Analyser for visualization
        // We create a new source for the remote stream
        const remoteSource = ctx.createMediaStreamSource(e.streams[0]);
        remoteSource.connect(analyser);
      };
      
      // Add microphone track to connection
      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });
      
      // Set up data channel for events
      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      
      dc.onopen = () => {
        setIsActive(true);
        updateStatus("listening");
        
        // Send a session update to configure VAD and turn detection
        const sessionUpdate = {
          type: "session.update",
          session: {
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            input_audio_transcription: {
              model: "whisper-1",
            },
          },
        };
        dc.send(JSON.stringify(sessionUpdate));
      };
      
      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          handleRealtimeEvent(event);
        } catch (err) {
          console.error("Failed to parse realtime event:", err);
        }
      };
      
      dc.onerror = (e) => {
        console.error("Data channel error:", e);
        onErrorRef.current?.("Connection error occurred");
        cleanup();
      };
      
      dc.onclose = () => {
        cleanup();
      };
      
      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Connect to OpenAI Realtime
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${client_secret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      
      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI Realtime");
      }
      
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
      
    } catch (error: any) {
      console.error("Voice chat error:", error);
      onErrorRef.current?.(error.message || "Failed to start voice chat");
      updateStatus("error");
      cleanup();
    }
  }, [cleanup, updateStatus]);

  const handleRealtimeEvent = React.useCallback((event: any) => {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        updateStatus("listening");
        break;
        
      case "input_audio_buffer.speech_stopped":
        updateStatus("processing");
        break;
        
      case "conversation.item.input_audio_transcription.completed":
        // User's speech transcribed
        userTranscriptRef.current = event.transcript || "";
        onTranscriptRef.current?.(userTranscriptRef.current, true);
        break;
        
      case "response.audio_transcript.delta":
        // AI response text streaming
        aiTranscriptRef.current += event.delta || "";
        break;
        
      case "response.audio.started":
        updateStatus("speaking");
        break;
        
      case "response.audio.done":
      case "response.done":
        // AI finished speaking
        if (aiTranscriptRef.current) {
          onAIResponseRef.current?.(aiTranscriptRef.current);
          aiTranscriptRef.current = "";
        }
        updateStatus("listening");
        break;
        
      case "error":
        console.error("Realtime error:", event.error);
        onErrorRef.current?.(event.error?.message || "An error occurred");
        break;
    }
  }, [updateStatus]);

  const stop = React.useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    isActive,
    start,
    stop,
    userTranscript: userTranscriptRef.current,
    analyserNode,
  };
}
