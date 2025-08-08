<script>
    import { onMount, onDestroy } from 'svelte';
    import { 
        Layout, 
        GameBoard, 
        PlayerInfo, 
        GameStatus, 
        MoveInput, 
        PromotionPopup,
        Button 
    } from '../lib/components';

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
    let yourTime = 1800;
    let otherTime = 1800;
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
        yourTime = gameInfo[yourTeam + "Time"] || yourTime;
        otherTime = gameInfo[globalOtherTeam + "Time"] || otherTime;

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
    <div class="game-container">
        <!-- Connection Status Indicator -->
        {#if connectionMessage}
            <div class="connection-status" class:reconnecting={connectionStatus === 'reconnecting'} class:disconnected={connectionStatus === 'disconnected'}>
                <div class="status-content">
                    {#if connectionStatus === 'reconnecting'}
                        <div class="spinner"></div>
                    {:else if connectionStatus === 'disconnected'}
                        <div class="disconnect-icon">⚠️</div>
                    {/if}
                    <span>{connectionMessage}</span>
                    {#if connectionStatus === 'disconnected' && gameStatus.includes('refresh')}
                        <button class="reconnect-btn" on:click={manualReconnect}>
                            Retry
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="game-layout">
            <!-- Left sidebar - Mobile hidden -->
            <div class="left-sidebar">
                <img 
                    src="/assets/logobanner.png" 
                    alt="O Xadrez" 
                    class="sidebar-logo"
                    on:click={() => window.location.href = '/'}
                    on:keydown={(e) => e.key === 'Enter' && (window.location.href = '/')}
                    tabindex="0"
                />
            </div>

            <!-- Main game area -->
            <div class="main-game-area">
                <!-- Opponent info -->
                <PlayerInfo {...otherPlayerInfo} />

                <!-- Game board or image -->
                <div class="board-container">
                    {#if showBoard}
                        <GameBoard config={boardConfig} isVisible={showBoard} />
                    {:else}
                        <img id="gameimage" src="" alt="Game board" class="game-image" />
                    {/if}
                </div>

                <!-- Your player info -->
                <PlayerInfo {...yourPlayerInfo} />

                <!-- Move input for non-standard games -->
                {#if showMoveInput}
                    <MoveInput onMove={handleTextMove} />
                {/if}
            </div>

            <!-- Right sidebar -->
            <div class="right-sidebar">
                <!-- Room Code Display -->
                {#if !gameInfo.isStarted}
                    <div class="room-code-display">
                        <span class="room-code-label">Room Code:</span>
                        <span class="room-code-value">{roomId}</span>
                    </div>
                {/if}
                
                <GameStatus 
                    {roomId} 
                    status={gameStatus} 
                    showQR={showQR && !gameInfo.isStarted}
                    shareUrl={roomUrl}
                />
                
                <Button 
                    variant="danger" 
                    onClick={handleResign}
                    size="large"
                >
                    Resign
                </Button>
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

<style>
    .game-container {
        height: 100vh;
        overflow: hidden;
        position: relative;
    }

    /* Connection Status Indicator */
    .connection-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }

    .connection-status.reconnecting {
        background-color: #FF9800;
        animation: pulse 2s infinite;
    }

    .connection-status.disconnected {
        background-color: #f44336;
    }

    .status-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .disconnect-icon {
        font-size: 16px;
    }

    .reconnect-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .reconnect-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    .game-layout {
        display: grid;
        grid-template-columns: 1fr auto;
        height: 100vh;
        gap: 16px;
        padding: 16px;
        padding-left: 136px; /* 120px sidebar + 16px gap */
        box-sizing: border-box;
    }

    .left-sidebar {
        background-color: #262522;
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 120px;
        position: fixed;
        left: 16px;
        top: 16px;
        height: calc(100vh - 32px);
        z-index: 10;
    }

    .sidebar-logo {
        width: 100%;
        height: auto;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .sidebar-logo:hover {
        transform: scale(1.05);
    }

    .main-game-area {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        min-width: 0;
    }

    .board-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
    }

    .game-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .right-sidebar {
        background-color: #262522;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 300px;
        height: fit-content;
        max-height: calc(100vh - 32px);
        overflow-y: auto;
    }

    .room-code-display {
        background-color: #3a3832;
        border-radius: 8px;
        padding: 12px 16px;
        text-align: center;
        border: 1px solid #4a463e;
    }

    .room-code-label {
        color: #b8b4a8;
        font-size: 14px;
        font-weight: 500;
        display: block;
        margin-bottom: 4px;
    }

    .room-code-value {
        color: #ffffff;
        font-size: 18px;
        font-weight: 700;
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
    }

    /* Tablet Layout */
    @media (max-width: 1024px) {
        .game-layout {
            grid-template-columns: 1fr 280px;
            gap: 12px;
            padding: 12px;
            padding-left: 12px; /* Reset padding since sidebar is hidden */
        }

        .left-sidebar {
            display: none;
        }

        .right-sidebar {
            width: 280px;
            padding: 16px;
        }
    }

    /* Mobile Layout */
    @media (max-width: 768px) {
        .game-container {
            height: 100vh;
        }

        .connection-status {
            top: 80px; /* Below the logo on mobile */
            right: 10px;
            left: 10px;
            right: auto;
            margin: 0 auto;
            width: fit-content;
            font-size: 12px;
            padding: 6px 12px;
        }

        .game-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            gap: 8px;
            padding: 8px;
            padding-left: 8px; /* Reset padding since sidebar is repositioned */
            padding-top: 80px; /* Space for top logo */
        }

        .left-sidebar {
            position: fixed;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            height: auto;
            padding: 8px 16px;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            z-index: 20;
        }

        .sidebar-logo {
            width: 120px;
            height: auto;
        }

        .main-game-area {
            gap: 12px;
        }

        .board-container {
            min-height: 240px; /* Reduced to account for top logo */
        }

        .right-sidebar {
            width: auto;
            padding: 12px;
            background-color: transparent;
            max-height: none;
            order: 2;
        }
    }

    /* Small Mobile */
    @media (max-width: 480px) {
        .game-layout {
            padding: 4px;
            padding-left: 4px; /* Reset padding since sidebar is repositioned */
            padding-top: 70px; /* Reduced space for smaller screen */
            gap: 6px;
        }

        .left-sidebar {
            top: 4px;
            padding: 6px 12px;
        }

        .sidebar-logo {
            width: 100px;
        }

        .main-game-area {
            gap: 8px;
        }

        .board-container {
            min-height: 200px; /* Reduced for small mobile with top logo */
        }

        .right-sidebar {
            padding: 8px;
        }
    }

    /* Landscape Mobile */
    @media (max-width: 768px) and (orientation: landscape) {
        .game-layout {
            grid-template-columns: 1fr 240px;
            grid-template-rows: 1fr;
            padding-left: 8px; /* Reset padding since sidebar is repositioned */
            padding-top: 60px; /* Reduced space for landscape */
        }

        .left-sidebar {
            top: 4px;
            padding: 4px 12px;
        }

        .sidebar-logo {
            width: 80px; /* Smaller logo for landscape */
        }

        .right-sidebar {
            background-color: #262522;
            order: 0;
            width: 240px;
            padding: 12px;
            max-height: calc(100vh - 16px);
            overflow-y: auto;
        }
    }
</style>
