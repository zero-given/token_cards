import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { TokenEventsList } from './components/TokenEventsList';
import { Token } from './types';

// Add type definitions
type TimeoutRef = ReturnType<typeof setTimeout>;
type IntervalRef = ReturnType<typeof setInterval>;

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const initialLoadDone = useRef(false);
  const reconnectTimeoutRef = useRef<TimeoutRef | null>(null);
  const heartbeatIntervalRef = useRef<IntervalRef | null>(null);
  const heartbeatTimeoutRef = useRef<TimeoutRef | null>(null);
  const isReconnecting = useRef(false);
  const lastMessageTime = useRef<string>('Never');
  const lastHeartbeatResponse = useRef<number>(Date.now());
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 5000;
  const HEARTBEAT_INTERVAL = 15000;
  const HEARTBEAT_TIMEOUT = 5000;

  // Add logging wrapper
  const log = {
    info: (...args: any[]) => {
      console.log('\n%c[INFO]', 'color: #2563eb; font-weight: bold;', ...args);
    },
    warn: (...args: any[]) => {
      console.log('\n%c[WARN]', 'color: #d97706; font-weight: bold;', ...args);
    },
    error: (...args: any[]) => {
      console.log('\n%c[ERROR]', 'color: #dc2626; font-weight: bold;', ...args);
    },
    success: (...args: any[]) => {
      console.log('\n%c[SUCCESS]', 'color: #059669; font-weight: bold;', ...args);
    },
    ws: (...args: any[]) => {
      console.log('\n%c[WEBSOCKET]', 'color: #7c3aed; font-weight: bold;', ...args);
    }
  };

  // Add server logging
  const serverLog = {
    info: (...args: any[]) => {
      console.log('\x1b[34m%s\x1b[0m', `[${new Date().toLocaleTimeString()}] ℹ️`, ...args);
    },
    warn: (...args: any[]) => {
      console.log('\x1b[33m%s\x1b[0m', `[${new Date().toLocaleTimeString()}] ⚠️`, ...args);
    },
    error: (...args: any[]) => {
      console.log('\x1b[31m%s\x1b[0m', `[${new Date().toLocaleTimeString()}] ❌`, ...args);
    },
    success: (...args: any[]) => {
      console.log('\x1b[32m%s\x1b[0m', `[${new Date().toLocaleTimeString()}] ✅`, ...args);
    },
    ws: (...args: any[]) => {
      console.log('\x1b[35m%s\x1b[0m', `[${new Date().toLocaleTimeString()}] 🔌`, ...args);
    }
  };

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const clearHeartbeatInterval = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((ws: WebSocket) => {
    clearHeartbeatInterval();
    
    const sendHeartbeat = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        
        // Set timeout for pong response
        heartbeatTimeoutRef.current = setTimeout(() => {
          const timeSinceLastResponse = Date.now() - lastHeartbeatResponse.current;
          if (timeSinceLastResponse > HEARTBEAT_TIMEOUT) {
            console.warn('No heartbeat response received, closing connection');
            ws.close();
          }
        }, HEARTBEAT_TIMEOUT);
      }
    };

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    // Send initial heartbeat
    sendHeartbeat();
  }, [clearHeartbeatInterval]);

  const updateConnectionState = useCallback((connected: boolean, ws?: WebSocket) => {
    setIsConnected(connected);
    if (!connected && ws) {
      ws.close();
      wsRef.current = null;
      clearHeartbeatInterval();
    }
  }, [clearHeartbeatInterval]);

  const fetchTokens = useCallback(async () => {
    log.info('Fetching tokens from API...');
    try {
      const response = await fetch('http://localhost:3002/api/tokens');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data || !data.tokens || !Array.isArray(data.tokens)) {
        throw new Error('Invalid API response format');
      }
      
      log.success(`Fetched ${data.tokens.length} tokens from API`);
      setTokens(data.tokens);
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    } catch (err) {
      log.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (isReconnecting.current) {
      console.warn('WebSocket reconnection already in progress');
      return null;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.info('WebSocket already connected');
      return wsRef.current;
    }

    isReconnecting.current = true;
    clearReconnectTimeout();
    clearHeartbeatInterval();

    if (wsRef.current) {
      console.info('Closing existing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      console.log('Creating new WebSocket connection');
      const ws = new WebSocket('ws://localhost:3002');
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        updateConnectionState(true);
        setRetryCount(0);
        setError(null);
        isReconnecting.current = false;
        startHeartbeat(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          lastMessageTime.current = new Date().toLocaleTimeString();
          
          // Update last heartbeat response time for any message received
          lastHeartbeatResponse.current = Date.now();
          
          switch (data.type) {
            case 'PONG':
              // Clear heartbeat timeout on pong
              if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current);
                heartbeatTimeoutRef.current = null;
              }
              log.info('Heartbeat response received');
              break;

            case 'NEW_TOKEN':
              serverLog.success('New token received:', data.token?.token_address);
              
              if (!data.token) {
                log.warn('No token data in NEW_TOKEN message:', data);
                return;
              }

              // Trigger a full refresh to get complete token data
              (async () => {
                try {
                  log.info('Refreshing token list after new token notification');
                  await fetchTokens();
                  log.success('Token list refreshed successfully');
                } catch (err) {
                  log.error('Failed to refresh tokens after new token notification:', err);
                }
              })();
              break;

            case 'CONNECTED':
              log.success('Server confirmed connection');
              break;

            default:
              log.warn('Unknown message type:', data.type);
          }
        } catch (err) {
          serverLog.error('Failed to process WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        serverLog.error('WebSocket error occurred');
        setIsConnected(false);
        ws.close();
      };

      ws.onclose = (event) => {
        serverLog.ws('WebSocket connection closed');
        setIsConnected(false);
        wsRef.current = null;
        clearHeartbeatInterval();
        
        if (retryCount < MAX_RETRIES && !isReconnecting.current) {
          serverLog.warn(`Scheduling reconnection attempt ${retryCount + 1}/${MAX_RETRIES}`);
          isReconnecting.current = true;
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            isReconnecting.current = false;
            connectWebSocket();
          }, RETRY_INTERVAL);
        } else if (retryCount >= MAX_RETRIES) {
          serverLog.error('Maximum reconnection attempts reached');
          setError('Maximum reconnection attempts reached');
          isReconnecting.current = false;
        }
      };

      return ws;
    } catch (err) {
      serverLog.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
      isReconnecting.current = false;
      return null;
    }
  }, [retryCount, startHeartbeat]);

  // Log token state changes
  useEffect(() => {
    log.info('Token state updated:', {
      count: tokens.length,
      lastUpdate: new Date().toLocaleTimeString(),
      newest: tokens[0] ? {
        address: tokens[0].address,
        name: tokens[0].name,
        timestamp: tokens[0].scanTimestamp
      } : 'No tokens'
    });
  }, [tokens]);

  // Initial setup
  useEffect(() => {
    serverLog.info('Application initializing');
    const ws = connectWebSocket();
    if (ws) {
      serverLog.ws('Initial WebSocket connection created');
    }
    
    serverLog.info('Fetching initial tokens');
    fetchTokens();

    return () => {
      serverLog.info('Cleaning up application');
      clearReconnectTimeout();
      clearHeartbeatInterval();
      if (wsRef.current) {
        serverLog.ws('Closing WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }
      isReconnecting.current = false;
    };
  }, [connectWebSocket, fetchTokens]);

  // Track connection state changes
  useEffect(() => {
    log.info('Connection state changed:', {
      isConnected,
      retryCount,
      wsState: wsRef.current?.readyState
    });
  }, [isConnected]);

  // Track retry count changes
  useEffect(() => {
    if (retryCount > 0) {
      log.warn('Retry count changed:', {
        current: retryCount,
        max: MAX_RETRIES,
        isReconnecting: isReconnecting.current
      });
    }
  }, [retryCount]);

  const handleReconnectClick = () => {
    log.info('Manual reconnection requested');
    setRetryCount(0);
    connectWebSocket();
  };

  const handleRefreshTokens = () => {
    log.info('Manual token refresh requested');
    fetchTokens();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 border border-gray-600 relative">
      {/* Top Container - Always on top */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 z-50 border-b border-gray-600">
        {/* Combined Status Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] bg-gradient-to-b from-purple-600/90 to-pink-600/90 backdrop-blur-md shadow-lg border border-gray-500 rounded-xl">
          <div className="px-6 py-3 flex items-center justify-between border border-gray-500 rounded-lg">
            <div className="flex items-center space-x-6 border-r border-gray-500 pr-6">
              {/* Title */}
              <h1 className="text-xl flex items-center gap-2 font-['Bebas_Neue'] font-normal">
                <span className="text-2xl">💎</span>
                <span className="text-white tracking-wide">
                  Token Explorer
                </span>
              </h1>

              {/* Connection Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    {isConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  </div>
                  <span className="text-sm text-white/90">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="text-sm text-white/80">
                  Retry Count: {retryCount}/{MAX_RETRIES}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-6 border-l border-gray-500">
              <button
                onClick={handleReconnectClick}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded backdrop-blur-sm transition-colors duration-150 text-sm border border-gray-500"
              >
                Reconnect
              </button>
              <button
                onClick={handleRefreshTokens}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded backdrop-blur-sm transition-colors duration-150 text-sm border border-gray-500"
              >
                Refresh Tokens
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Starts below fixed top section */}
      <div className="pt-24 relative z-0">
        {loading && <div className="p-4 border border-gray-600">Loading tokens...</div>}
        {!loading && <TokenEventsList tokens={tokens} />}
      </div>
    </div>
  );
}

export default App;
