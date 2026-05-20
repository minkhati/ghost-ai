"use client";

import React from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { Canvas } from "@/components/editor/canvas";

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const errorFallback = (
  <div className="h-full flex items-center justify-center">
    <p className="text-sm text-copy-muted">Canvas connection error — please refresh.</p>
  </div>
);

const loadingFallback = (
  <div className="h-full flex items-center justify-center">
    <p className="text-sm text-copy-muted">Connecting…</p>
  </div>
);

interface CanvasWrapperProps {
  roomId: string;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
}

export function CanvasWrapper({ roomId, isTemplatesOpen, onCloseTemplates }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary fallback={errorFallback}>
          <ClientSideSuspense fallback={loadingFallback}>
            <Canvas isTemplatesOpen={isTemplatesOpen} onCloseTemplates={onCloseTemplates} />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
