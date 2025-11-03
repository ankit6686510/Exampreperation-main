import { useEffect, useState, useCallback } from 'react';
import {
  joinStudyRoom,
  leaveStudyRoom,
  updatePresence,
  sendMessage,
  onParticipantJoined,
  onParticipantLeft,
  onPresenceUpdated,
  onPomodoroUpdated,
  onSessionStartNotification,
  onSessionEndNotification,
  onNewMessage,
  offParticipantJoined,
  offParticipantLeft,
  offPresenceUpdated,
  offPomodoroUpdated,
  offSessionStartNotification,
  offSessionEndNotification,
  offNewMessage
} from '@/lib/socket';

interface Participant {
  userId: string;
  status: 'online' | 'studying' | 'idle';
  joinedAt: Date;
}

interface Message {
  userId: string;
  message: string;
  timestamp: Date;
}

interface PomodoroState {
  phase: 'work' | 'short-break' | 'long-break';
  startTime: Date;
  endTime: Date;
  timestamp: Date;
}

export const useStudyRoomSocket = (roomId: string | null) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    joinStudyRoom(roomId);

    const handleParticipantJoined = (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(data.participants);
      }
    };

    const handleParticipantLeft = (data: any) => {
      if (data.roomId === roomId) {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      }
    };

    const handlePresenceUpdated = (data: any) => {
      setParticipants(prev =>
        prev.map(p =>
          p.userId === data.userId
            ? { ...p, status: data.status }
            : p
        )
      );
    };

    const handlePomodoroUpdated = (data: PomodoroState) => {
      setPomodoroState(data);
    };

    const handleSessionStart = (data: any) => {
      if (data.roomId === roomId) {
        setSessionActive(true);
      }
    };

    const handleSessionEnd = (data: any) => {
      if (data.roomId === roomId) {
        setSessionActive(false);
      }
    };

    const handleNewMessage = (data: Message) => {
      setMessages(prev => [...prev, data]);
    };

    onParticipantJoined(handleParticipantJoined);
    onParticipantLeft(handleParticipantLeft);
    onPresenceUpdated(handlePresenceUpdated);
    onPomodoroUpdated(handlePomodoroUpdated);
    onSessionStartNotification(handleSessionStart);
    onSessionEndNotification(handleSessionEnd);
    onNewMessage(handleNewMessage);

    return () => {
      if (roomId) {
        leaveStudyRoom(roomId);
      }
      offParticipantJoined();
      offParticipantLeft();
      offPresenceUpdated();
      offPomodoroUpdated();
      offSessionStartNotification();
      offSessionEndNotification();
      offNewMessage();
    };
  }, [roomId]);

  const updateMyPresence = useCallback((status: 'online' | 'studying' | 'idle') => {
    if (roomId) {
      updatePresence(roomId, status);
    }
  }, [roomId]);

  const sendChatMessage = useCallback((message: string) => {
    if (roomId) {
      sendMessage(roomId, message);
    }
  }, [roomId]);

  return {
    participants,
    messages,
    pomodoroState,
    sessionActive,
    updateMyPresence,
    sendChatMessage
  };
};