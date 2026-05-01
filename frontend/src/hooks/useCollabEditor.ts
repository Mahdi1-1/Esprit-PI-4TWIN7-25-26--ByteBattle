import { useEffect, useRef, useCallback } from 'react';

/**
 * T095 — Hook for collaborative editor with Yjs CRDT sync.
 *
 * NOTE: This hook is a thin adapter. Full Yjs integration (y-monaco, Yjs Doc)
 * requires the `yjs` and `y-monaco` packages to be installed (T135).
 * Until then, this provides the socket-based relay layer.
 */
export function useCollabEditor(options: {
  hackathonId: string;
  teamId: string;
  challengeId: string;
  sendCollabSync: (data: { teamId: string; hackathonId: string; challengeId: string; update: number[] }) => void;
  sendCollabAwareness: (data: { teamId: string; awareness: any }) => void;
  onCollabSync: (cb: (data: { challengeId: string; update: number[] }) => void) => (() => void);
  onCollabAwareness: (cb: (data: any) => void) => (() => void);
}) {
  const { hackathonId, teamId, challengeId, sendCollabSync, sendCollabAwareness, onCollabSync, onCollabAwareness } = options;

  // Placeholder for Yjs Doc ref (will be populated when yjs is installed)
  const yjsDocRef = useRef<any>(null);

  // Broadcast local changes to team
  const broadcastUpdate = useCallback((update: Uint8Array) => {
    sendCollabSync({
      teamId,
      hackathonId,
      challengeId,
      update: Array.from(update),
    });
  }, [teamId, hackathonId, challengeId, sendCollabSync]);

  // Broadcast cursor awareness
  const broadcastAwareness = useCallback((awarenessState: any) => {
    sendCollabAwareness({ teamId, awareness: awarenessState });
  }, [teamId, sendCollabAwareness]);

  // Listen for remote updates
  useEffect(() => {
    const cleanupSync = onCollabSync((data) => {
      if (data.challengeId !== challengeId) return;
      // Apply remote Yjs update to local doc (when yjs is installed)
      // Y.applyUpdate(yjsDocRef.current, new Uint8Array(data.update));
    });

    const cleanupAwareness = onCollabAwareness((_data) => {
      // Update remote cursor positions (when yjs is installed)
    });

    return () => {
      cleanupSync();
      cleanupAwareness();
    };
  }, [challengeId, onCollabSync, onCollabAwareness]);

  return {
    yjsDocRef,
    broadcastUpdate,
    broadcastAwareness,
  };
}
