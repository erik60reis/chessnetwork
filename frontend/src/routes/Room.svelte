<script>
    import { onMount, onDestroy } from 'svelte';
    import { 
        Layout, 
        GameBoard, 
        PlayerInfo, 
        GameStatus, 
        MoveInput, 
        PromotionPopup,
        Button,
        Card,
        CardContent
    } from '../lib/components';
    import { cn } from '../lib/utils.js';

    export let roomId;

    // Check if room exists
    fetch(`/api/roomexists/${roomId}`).then(response => response.json()).then(data => {
        if (!data.exists) {
            window.location.href = "/";
        }
    });

    // Game state
    let socket;
    let gameInfo = {};
    let isMyTurn = false;
    let globalYourTeam = "white";
    let globalOtherTeam = "black";
    let isViewOnlyMode = false;
    let yourTime = 0;
    let otherTime = 0;
    let gameStatus = "Waiting for opponent...";
    let showPromotionPopup = false;
    let pendingMove = null;
    let promotionIsWhite = true;

    // Connection status
    let connectionStatus = "connecting"; // connecting, connected, disconnected, reconnecting
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 10;
    let opponentDisconnected = false;

    // Board configuration
    let boardConfig = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        width: 8,
        height: 8,
        pieceTheme: "/assets/chesspieces/%piece%.png",
        isFlipped: false,
        legalMoves: {},
        onMove: handleBoardMove
    };

    // Game display states
    let showBoard = true;
    let showMoveInput = false;
    let showQR = true;

    // Sound effects
    let soundMove, soundCapture;

    onMount(() => {
        initializeSounds();
        initializeSocket();
        startTimers();
        loadExternalScripts();
    });

    onDestroy(() => {
        if (socket) {
            socket.disconnect();
        }
    });

    function initializeSounds() {
        soundMove = new Audio("assets/sounds/move.wav");
        soundCapture = new Audio("assets/sounds/capture.wav");
    }

    function loadExternalScripts() {
        // Load required scripts
        const scripts = [
            '/assets/scripts/gameboard.js',
            '/assets/scripts/qrcode.min.js',
            '/socket.io/socket.io.js'
        ];

        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            document.head.appendChild(script);
        });
    }

    function initializeSocket() {
        const interval = setInterval(() => {
            if (typeof window !== 'undefined' && window.io) {
                socket = window.io({
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    maxReconnectionAttempts: maxReconnectAttempts,
                    timeout: 20000,
                    forceNew: true
                });

                // Connection established
                socket.on('connect', () => {
                    console.log('Socket connected');
                    connectionStatus = "connected";
                    reconnectAttempts = 0;
                    joinRoom();
                });

                // Connection lost
                socket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    connectionStatus = "disconnected";
                    
                    // Don't show disconnected state for intentional disconnects
                    if (reason === 'io client disconnect' || reason === 'io server disconnect') {
                        return;
                    }
                });

                // Attempting to reconnect
                socket.on('reconnect_attempt', (attemptNumber) => {
                    console.log('Reconnection attempt:', attemptNumber);
                    connectionStatus = "reconnecting";
                    reconnectAttempts = attemptNumber;
                });

                // Successfully reconnected
                socket.on('reconnect', (attemptNumber) => {
                    console.log('Successfully reconnected after', attemptNumber, 'attempts');
                    connectionStatus = "connected";
                    reconnectAttempts = 0;
                    joinRoom(); // Automatically rejoin the room
                });

                // Failed to reconnect
                socket.on('reconnect_failed', () => {
                    console.log('Failed to reconnect after', maxReconnectAttempts, 'attempts');
                    connectionStatus = "disconnected";
                    gameStatus = "Connection lost. Please refresh the page.";
                });

                // Connection error
                socket.on('connect_error', (error) => {
                    console.log('Connection error:', error);
                    connectionStatus = "disconnected";
                });

                // Game-specific events
                socket.on('moveMade', handleMoveMade);
                socket.on('DisableViewOnlyMode', () => {
                    joinRoom();
                    isViewOnlyMode = false;
                });

                // Handle opponent disconnection from backend
                socket.on('playerDisconnected', (data) => {
                    console.log('Player disconnected:', data);
                    opponentDisconnected = true;
                    gameStatus = data.message || "Opponent disconnected. They have 60 seconds to reconnect.";
                });

                // Handle opponent reconnection from backend
                socket.on('playerReconnected', (data) => {
                    console.log('Player reconnected:', data);
                    opponentDisconnected = false;
                    gameStatus = data.message || "Opponent reconnected.";
                    
                    // Clear the status message after a few seconds
                    setTimeout(() => {
                        if (gameInfo.isStarted) {
                            gameStatus = "";
                        }
                    }, 3000);
                });

                clearInterval(interval);
            }
        }, 100);
    }

    function joinRoom() {
        socket.emit('joinRoomWeb', roomId, window.localStorage.getItem('authid'), window.localStorage.getItem('authpassword'), window.location.href, '');
    }

    function handleBoardMove(orig, dest) {
        if (gameInfo.gametype === "checkers") {
            const origIndex = chessSquareToCheckersIndex(orig, gameInfo.boardDimensions.height, gameInfo.boardDimensions.width);
            const destIndex = chessSquareToCheckersIndex(dest, gameInfo.boardDimensions.height, gameInfo.boardDimensions.width);
            socket.emit('makeMove', `${origIndex}-${destIndex}`);
            return;
        }
        
        // Find all legal moves from the origin square
        const originLegalMoves = gameInfo.legalMoves?.filter(move => 
            move.startsWith(orig) && move.slice(2, 4) === dest
        ) || [];
        
        // If there are multiple legal moves to the same square, it's a promotion
        if (originLegalMoves.length > 1) {
            showPromotionDialog(orig, dest);
        } else if (originLegalMoves.length === 1) {
            // If there's exactly one move and it's a promotion move (length 5)
            if (originLegalMoves[0].length === 5) {
                showPromotionDialog(orig, dest);
            } else {
                socket.emit('makeMove', orig + dest);
            }
        }
    }

    function showPromotionDialog(orig, dest) {
        pendingMove = { orig, dest };
        promotionIsWhite = gameInfo.turn;
        showPromotionPopup = true;
    }

    function handlePromotion(pieceType) {
        if (pendingMove) {
            socket.emit('makeMove', pendingMove.orig + pendingMove.dest + pieceType);
            showPromotionPopup = false;
            pendingMove = null;
        }
    }

    function handleTextMove(moveText) {
        socket.emit('makeMove', moveText);
    }

    function handleResign() {
        socket.emit('resign');
    }

    function handleMoveMade(imageDataUri, statusText, newGameInfo, yourTeam) {
        gameInfo = newGameInfo;
        globalYourTeam = yourTeam;
        globalOtherTeam = yourTeam === "white" ? "black" : "white";

        // Update board configuration
        if (gameInfo.gametype && (gameInfo.gametype === "chess" && !["amazons", "crazyhouse"].includes(gameInfo.variant)) || gameInfo.gametype === "checkers" || gameInfo.gametype === "chess2.0") {
            showBoard = true;
            showMoveInput = false;
            
            boardConfig = {
                ...boardConfig,
                fen: gameInfo.fen,
                isFlipped: !(yourTeam === "white"),
                legalMoves: (!isViewOnlyMode && gameInfo.turn === (yourTeam === "white") ? getDests(gameInfo.legalMoves, gameInfo.boardDimensions?.height || 8) : {}),
                width: gameInfo.boardDimensions?.width || 8,
                height: gameInfo.boardDimensions?.height || 8,
                pieceTheme: getThemeForGameType(gameInfo.gametype)
            };
        } else {
            showBoard = false;
            showMoveInput = true;
        }

        // Update times
        yourTime = gameInfo[yourTeam + "Time"] || 0;
        otherTime = gameInfo[globalOtherTeam + "Time"] || 0;

        // Update turn status
        isMyTurn = (yourTeam === 'white') === gameInfo.turn;

        // Update status
        if (gameInfo.isStarted) {
            gameStatus = "";
        }
        
        if (statusText) {
            gameStatus = statusText;
        }

        // Play sounds
        if (gameInfo.moves?.length > 0) {
            const lastMove = gameInfo.moves[gameInfo.moves.length - 1];
            if (lastMove.length === 5) {
                soundCapture?.play();
            } else if (lastMove.length === 4) {
                soundMove?.play();
            }
        }
    }

    function getThemeForGameType(gameType) {
        switch (gameType) {
            case "chess": return "/assets/chesspieces/%piece%.png";
            case "checkers": return "/assets/checkerspieces/%piece%.png";
            case "chess2.0": return "/assets/chess2.0pieces/%piece%.png";
            default: return "/assets/chesspieces/%piece%.png";
        }
    }

    function startTimers() {
        setInterval(() => {
            if (gameInfo.isStarted) {
                if (isMyTurn) {
                    yourTime = Math.max(0, yourTime - 0.2);
                } else {
                    otherTime = Math.max(0, otherTime - 0.2);
                }
            }
        }, 200);
    }

    function formatTime(timeSeconds) {
        const timeWithoutDecimals = Math.ceil(timeSeconds);
        const timeMinutes = Math.floor(timeWithoutDecimals / 60);
        const timeHours = Math.floor(timeMinutes / 60);
        const minutes = timeMinutes % 60;
        const seconds = timeWithoutDecimals % 60;
        
        if (timeHours > 0) {
            return `${timeHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // Helper functions (keeping original logic)
    function chessSquareToCheckersIndex(chessNotation, rankCount = 8, fileCount = 8) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        let index = 1;

        for (let i = rankCount; i >= 1; i--) {
            for (let j = ((i % 2) == 0 ? 1 : 0); j < fileCount; j += 2) {
                let letter = letters[j];
                if (letter + i == chessNotation) {
                    return ((index - 1) / 2) + 1;
                }
                index += 2;
            }
        }
        return undefined;
    }

    function getDests(legalMoves, boardRanks) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const moves = {};
        
        letters.split("").forEach((letter) => {
            for (let number = 1; number <= boardRanks; number++) {
                let legalMovesFormatted = {};
                legalMoves?.forEach(legalMove => {
                    if (legalMove.startsWith((letter + number))) {
                        const destSquare = legalMove.slice(2, 4);
                        legalMovesFormatted[destSquare] = true;
                    }
                });
                if (Object.keys(legalMovesFormatted).length > 0) {
                    moves[letter + number] = legalMovesFormatted;
                }
            }
        });
        return moves;
    }

    // Reactive statements for player info
    $: yourPlayerInfo = {
        username: gameInfo[globalYourTeam + "Name"] || "Guest",
        elo: gameInfo[globalYourTeam + "Elo"],
        time: formatTime(yourTime),
        isCurrentPlayer: isMyTurn
    };

    $: otherPlayerInfo = {
        username: gameInfo[globalOtherTeam + "Name"] || "Guest", 
        elo: gameInfo[globalOtherTeam + "Elo"],
        time: formatTime(otherTime),
        isCurrentPlayer: !isMyTurn && gameInfo.isStarted
    };

    $: roomUrl = `${window?.location?.origin}/l/${roomId}`;

    // Connection status message
    $: connectionMessage = getConnectionMessage(connectionStatus, reconnectAttempts);

    function getConnectionMessage(status, attempts) {
        switch (status) {
            case "connecting":
                return "Connecting...";
            case "connected":
                return null; // No message when connected
            case "disconnected":
                return "Connection lost";
            case "reconnecting":
                return `Reconnecting... (${attempts}/${maxReconnectAttempts})`;
            default:
                return null;
        }
    }

    function manualReconnect() {
        if (socket) {
            socket.disconnect();
        }
        connectionStatus = "connecting";
        reconnectAttempts = 0;
        
        // Wait a moment then reinitialize
        setTimeout(() => {
            initializeSocket();
        }, 500);
    }
</script>

<Layout showLogo={false}>
    <div class="min-h-screen bg-background">
        <!-- Connection Status Indicator -->
        {#if connectionMessage}
            <div class="fixed top-2 right-2 lg:top-4 lg:right-4 z-50">
                <div class={cn(
                    'flex items-center gap-2 px-3 py-1 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium shadow-lg',
                    connectionStatus === 'reconnecting' && 'bg-orange-500 text-white animate-pulse',
                    connectionStatus === 'disconnected' && 'bg-red-500 text-white',
                    connectionStatus === 'connecting' && 'bg-blue-500 text-white'
                )}>
                    {#if connectionStatus === 'reconnecting'}
                        <div class="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {:else if connectionStatus === 'disconnected'}
                        <div class="w-3 h-3 lg:w-4 lg:h-4">⚠️</div>
                    {/if}
                    <span class="hidden sm:inline">{connectionMessage}</span>
                    <span class="sm:hidden">
                        {#if connectionStatus === 'reconnecting'}
                            Reconnecting...
                        {:else if connectionStatus === 'disconnected'}
                            Disconnected
                        {:else if connectionStatus === 'connecting'}
                            Connecting...
                        {/if}
                    </span>
                    {#if connectionStatus === 'disconnected' && gameStatus.includes('refresh')}
                        <button 
                            class="ml-1 lg:ml-2 px-1 py-0.5 lg:px-2 lg:py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
                            on:click={manualReconnect}
                        >
                            Retry
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="container mx-auto px-2 py-2 h-screen max-h-screen overflow-hidden">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-2 max-w-7xl mx-auto h-full">
                <!-- Left sidebar - Navigation (Desktop only) -->
                <div class="hidden lg:flex lg:col-span-1 flex-col">
                    <Card class="flex-shrink-0">
                        <CardContent class="p-3">
                            <div class="text-center">
                                <button 
                                    class="bg-transparent border-none p-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                                    on:click={() => window.location.href = '/'}
                                    on:keydown={(e) => e.key === 'Enter' && (window.location.href = '/')}
                                    tabindex="0"
                                >
                                    <img 
                                        src="/assets/logobanner.png" 
                                        alt="O Xadrez" 
                                        class="h-10 w-auto mx-auto"
                                    />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <!-- Main game area -->
                <div class="lg:col-span-2 flex flex-col h-full">
                    <!-- Mobile header with logo -->
                    <div class="lg:hidden flex-shrink-0 mb-1">
                        <Card>
                            <CardContent class="p-1">
                                <div class="text-center">
                                    <button 
                                        class="bg-transparent border-none p-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                                        on:click={() => window.location.href = '/'}
                                        on:keydown={(e) => e.key === 'Enter' && (window.location.href = '/')}
                                        tabindex="0"
                                    >
                                        <img 
                                            src="/assets/logobanner.png" 
                                            alt="O Xadrez" 
                                            class="h-6 w-auto mx-auto"
                                        />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div class="flex flex-col h-full space-y-2">
                        <!-- Opponent info -->
                        <div class="flex-shrink-0">
                            <PlayerInfo {...otherPlayerInfo} />
                        </div>

                        <!-- Game board or image -->
                        <div class="flex-1 min-h-0 max-h-[80vh]">
                            <Card class="h-full">
                                <CardContent class="p-1 lg:p-2 h-full">
                                    <div class="h-full bg-card rounded-lg border border-border flex items-center justify-center">
                                        {#if showBoard}
                                            <GameBoard config={boardConfig} isVisible={showBoard} />
                                        {:else}
                                            <img id="gameimage" src="" alt="Game board" class="max-w-full max-h-full object-contain rounded" />
                                        {/if}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <!-- Your player info -->
                        <div class="flex-shrink-0">
                            <PlayerInfo {...yourPlayerInfo} />
                        </div>

                        <!-- Move input for non-standard games -->
                        {#if showMoveInput}
                            <div class="flex-shrink-0">
                                <MoveInput onMove={handleTextMove} />
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Right sidebar -->
                <div class="lg:col-span-1 flex flex-col">
                    <div class="flex flex-col space-y-1 lg:space-y-2 h-full">
                        <div class="flex-shrink-0">
                            <GameStatus 
                                {roomId} 
                                status={gameStatus} 
                                showQR={showQR && !gameInfo.isStarted}
                                shareUrl={roomUrl}
                            />
                        </div>
                        
                        <div class="flex-shrink-0">
                            <Button 
                                variant="destructive" 
                                onClick={handleResign}
                                class="w-full"
                            >
                                Resign
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Promotion popup -->
    <PromotionPopup 
        isVisible={showPromotionPopup}
        isWhite={promotionIsWhite}
        onPromote={handlePromotion}
    />
</Layout>

