<script>
  import { onMount, onDestroy } from 'svelte';

  export let config = {};
  export let isVisible = true;

  let gameBoard;
  let board = null;
  let resizeObserver;

  // Default configuration
  const defaultConfig = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    width: 8,
    height: 8,
    pieceTheme: "/assets/chesspieces/%piece%.png",
    isFlipped: false,
    legalMoves: {},
    onMove: () => {}
  };

  $: finalConfig = { ...defaultConfig, ...config };
  $: boardDimensionClass = `board${finalConfig.width}x${finalConfig.height}`;

  onMount(() => {
    initializeBoard();
    setupResizeObserver();
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  function initializeBoard() {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.createGameBoard && gameBoard) {
        board = window.createGameBoard(gameBoard, finalConfig);
        // Give the DOM a moment to render before sizing
        setTimeout(() => {
          updateBoardSize();
        }, 10);
        clearInterval(interval);
      }
    }, 100);
  }

  function setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined' && gameBoard) {
      resizeObserver = new ResizeObserver(() => {
        updateBoardSize();
      });
      resizeObserver.observe(gameBoard);
    }
  }

  function updateBoardSize() {
    if (!gameBoard) return;

    const container = gameBoard.parentElement;
    if (!container) return;

    // Calculate optimal size based on container
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Ensure we have valid dimensions
    if (containerWidth === 0 || containerHeight === 0) {
      // Fallback to default size
      gameBoard.style.width = `480px`;
      gameBoard.style.height = `480px`;
      return;
    }
    
    const minDimension = Math.min(containerWidth, containerHeight * 0.9);
    const boardSize = Math.max(minDimension, 240); // Minimum size of 240px
    
    // Set board size
    gameBoard.style.width = `${boardSize}px`;
    gameBoard.style.height = `${boardSize}px`;

    // Update piece and square sizes
    updatePieceAndSquareSizes();
  }

  function updatePieceAndSquareSizes() {
    if (!gameBoard || !finalConfig.width || !finalConfig.height) return;

    const boardSize = Math.min(gameBoard.clientWidth, gameBoard.clientHeight);
    const squareSize = boardSize / Math.max(finalConfig.width, finalConfig.height);

    // Update pieces
    const pieces = gameBoard.querySelectorAll('piece');
    pieces.forEach(piece => {
      piece.style.width = `${squareSize}px`;
      piece.style.height = `${squareSize}px`;
    });

    // Update squares
    const squares = gameBoard.querySelectorAll('square');
    squares.forEach(square => {
      square.style.width = `${squareSize}px`;
      square.style.height = `${squareSize}px`;
    });
  }

  // Update board when config changes
  $: if (board && gameBoard) {
    board = window.createGameBoard(gameBoard, finalConfig);
    updateBoardSize();
  }

  // Re-initialize board when visibility changes
  $: if (isVisible && gameBoard && !board) {
    initializeBoard();
  }
</script>

<div class="gameboard-container" class:visible={isVisible}>
  <div bind:this={gameBoard} class="gameboard {boardDimensionClass}"></div>
</div>

<style>
  .gameboard-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .gameboard-container:not(.visible) {
    display: none;
  }

  .gameboard {
    width: 480px;
    height: 480px;
    min-width: 240px;
    min-height: 240px;
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    background-color: #f0d9b5;
    aspect-ratio: 1;
  }

  /* Board dimension classes for specific styling if needed */
  .board8x8 {
    /* Standard chess board */
  }

  .board10x8 {
    aspect-ratio: 1.25;
  }

  .board10x10 {
    aspect-ratio: 1;
  }

  @media (max-width: 768px) {
    .gameboard-container {
      padding: 8px;
    }

    .gameboard {
      border-radius: 6px;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 200px);
    }
  }

  @media (max-width: 480px) {
    .gameboard {
      max-height: calc(100vh - 250px);
    }
  }
</style>
