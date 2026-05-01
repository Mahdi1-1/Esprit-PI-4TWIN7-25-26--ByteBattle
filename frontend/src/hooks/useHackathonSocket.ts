import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = 'http://localhost:4001/hackathons';

interface UseHackathonSocketOptions {
  hackathonId: string;
  teamId?: string;
  isAdmin?: boolean;
}

/**
 * T093 — WebSocket hook for hackathon real-time events.
 *
 * Connects to the `/hackathons` namespace, authenticates with JWT,
 * and joins the appropriate rooms.
 */
export function useHackathonSocket({ hackathonId, teamId, isAdmin }: UseHackathonSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !hackathonId) return;

    const socket = io(WS_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_hackathon', { hackathonId });

      if (teamId) {
        socket.emit('join_team', { hackathonId, teamId, isAdmin });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [hackathonId, teamId, isAdmin]);

  // ── Join team room (call when team changes) ──
  const joinTeamRoom = useCallback((newTeamId: string) => {
    socketRef.current?.emit('join_team', { hackathonId, teamId: newTeamId, isAdmin });
  }, [hackathonId, isAdmin]);

  // ── Listeners ──
  const onScoreboardUpdate = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('scoreboard:update', cb);
    return () => { socketRef.current?.off('scoreboard:update', cb); };
  }, []);

  const onAnnouncement = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('announcement:new', cb);
    return () => { socketRef.current?.off('announcement:new', cb); };
  }, []);

  const onSubmissionVerdict = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('submission:verdict', cb);
    return () => { socketRef.current?.off('submission:verdict', cb); };
  }, []);

  const onStatusChange = useCallback((cb: (data: { hackathonId: string; oldStatus: string; newStatus: string }) => void) => {
    socketRef.current?.on('hackathon:status_change', cb);
    return () => { socketRef.current?.off('hackathon:status_change', cb); };
  }, []);

  const onTeamMessage = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('team:message', cb);
    return () => { socketRef.current?.off('team:message', cb); };
  }, []);

  const onCollabSync = useCallback((cb: (data: { challengeId: string; update: number[] }) => void) => {
    socketRef.current?.on('collab:sync', cb);
    return () => { socketRef.current?.off('collab:sync', cb); };
  }, []);

  const onCollabAwareness = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('collab:awareness', cb);
    return () => { socketRef.current?.off('collab:awareness', cb); };
  }, []);

  const onClarificationResponse = useCallback((cb: (data: any) => void) => {
    socketRef.current?.on('clarification:response', cb);
    return () => { socketRef.current?.off('clarification:response', cb); };
  }, []);

  // ── Emitters ──
  const sendTeamMessage = useCallback((data: { hackathonId: string; teamId: string; content: string; codeSnippet?: string; codeLanguage?: string }) => {
    socketRef.current?.emit('team_message', data);
  }, []);

  const sendCollabSync = useCallback((data: { teamId: string; hackathonId: string; challengeId: string; update: number[] }) => {
    socketRef.current?.emit('collab_sync', data);
  }, []);

  const sendCollabAwareness = useCallback((data: { teamId: string; awareness: any }) => {
    socketRef.current?.emit('collab_awareness', data);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    joinTeamRoom,
    // Listeners
    onScoreboardUpdate,
    onAnnouncement,
    onSubmissionVerdict,
    onStatusChange,
    onTeamMessage,
    onCollabSync,
    onCollabAwareness,
    onClarificationResponse,
    // Emitters
    sendTeamMessage,
    sendCollabSync,
    sendCollabAwareness,
  };
}
