import { useCallback, useEffect, useRef, useState } from "react";
import { WEBSOCKET } from "@/constants";
import { logger } from "@/lib/logger";

const wsLogger = logger.child("websocket");

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  send: (data: string | ArrayBuffer | Blob) => void;
  reconnect: () => void;
  lastMessage: unknown | null;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {},
): UseWebSocketReturn {
  const {
    onMessage,
    onError,
    reconnectDelay = WEBSOCKET.RECONNECT_DELAY,
    maxReconnectAttempts = WEBSOCKET.MAX_RECONNECT_ATTEMPTS,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    wsLogger.debug("Connecting to WebSocket", { url });

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        wsLogger.info("WebSocket connected", { url });
        setStatus("connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as unknown;
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      ws.onerror = (event: Event) => {
        wsLogger.error("WebSocket error", { url });
        setStatus("error");
        onError?.(event);
      };

      ws.onclose = () => {
        wsLogger.warn("WebSocket closed", { url });
        setStatus("disconnected");
        wsRef.current = null;

        if (mountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          wsLogger.info("Reconnecting...", {
            attempt: reconnectAttemptsRef.current,
            maxAttempts: maxReconnectAttempts,
          });
          reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
        }
      };
    } catch (error) {
      wsLogger.error("WebSocket connection failed", { error: String(error) });
      setStatus("error");
    }
  }, [url, onMessage, onError, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      wsLogger.warn("Cannot send - WebSocket not connected");
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    mountedRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, send, reconnect, lastMessage };
}
