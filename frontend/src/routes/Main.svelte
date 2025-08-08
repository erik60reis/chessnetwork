<script>
  import { onMount } from 'svelte';
  import { 
    Layout, 
    GameBoard, 
    QuickPlayGrid, 
    RoomJoin, 
    GameOptions 
  } from '../lib/components';

  let gameBoard;
  let boardConfig = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    pieceTheme: "/assets/chesspieces/%piece%.png",
    width: 8,
    height: 8,
    isFlipped: false,
    legalMoves: {},
    onMove: () => {} // No moves allowed on main page
  };

  onMount(() => {
    // Load the gameboard script
    const script = document.createElement('script');
    script.src = '/assets/scripts/gameboard.js';
    document.head.appendChild(script);
  });
</script>

<Layout showLogo={false}>
  <div class="main-container">
    <div class="content-grid">
      <!-- Left Sidebar -->
      <div class="left-sidebar">
        <div class="logo-container">
          <img 
            src="/assets/logobanner.png" 
            alt="O Xadrez Logo" 
            class="main-logo"
            on:click={() => window.location.href = '/'}
            on:keydown={(e) => e.key === 'Enter' && (window.location.href = '/')}
            tabindex="0"
          />
        </div>
        <div class="sidebar-links">
          <a href="/add-discord-bot" class="discord-link">
            Add Discord Bot
          </a>
        </div>
      </div>

      <!-- Chess Board Display (Desktop/Tablet Only) -->
      <div class="board-section">
        <GameBoard config={boardConfig} />
      </div>

      <!-- Game Controls -->
      <div class="controls-section">
        <QuickPlayGrid />
        <RoomJoin />
        <GameOptions />
      </div>
    </div>
  </div>
</Layout>

<style>
  .main-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;
    margin-left: 156px; /* 140px sidebar + 16px gap */
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 32px;
    align-items: start;
  }

  .left-sidebar {
    background-color: #262522;
    border-radius: 12px;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: calc(100vh - 40px);
    position: fixed;
    left: 16px;
    top: 20px;
    width: 140px;
    z-index: 10;
  }

  .logo-container {
    text-align: center;
  }

  .main-logo {
    width: 100%;
    height: auto;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .main-logo:hover {
    transform: scale(1.05);
  }

  .sidebar-links {
    text-align: center;
  }

  .discord-link {
    color: #7fa650;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: color 0.2s ease;
    word-wrap: break-word;
  }

  .discord-link:hover {
    color: #8fb760;
    text-decoration: underline;
  }

  .board-section {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 40px);
    width: 100%;
    background-color: #262522;
    border-radius: 12px;
    padding: 24px;
    box-sizing: border-box;
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Tablet Layout */
  @media (max-width: 1200px) {
    .main-container {
      margin-left: 136px; /* 120px sidebar + 16px gap */
    }

    .content-grid {
      grid-template-columns: 1fr 350px;
      gap: 24px;
    }

    .board-section {
      height: calc(100vh - 40px);
      padding: 20px;
    }

    .left-sidebar {
      width: 120px;
      padding: 16px 12px;
      gap: 20px;
      height: calc(100vh - 40px);
    }
  }

  /* Mobile Layout */
  @media (max-width: 768px) {
    .main-container {
      padding: 0 8px;
      margin-left: 0; /* Reset margin for mobile */
      padding-top: 80px; /* Space for top logo */
    }

    .content-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .board-section {
      display: none; /* Hide board on mobile to save space */
    }

    .left-sidebar {
      position: fixed;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: auto;
      height: auto;
      padding: 8px 16px;
      gap: 12px;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .logo-container {
      text-align: center;
    }

    .main-logo {
      width: 120px;
      height: auto;
    }

    .sidebar-links {
      text-align: center;
    }

    .controls-section {
      gap: 12px;
    }

    .discord-link {
      font-size: 12px;
      white-space: nowrap;
    }
  }

  /* Small Mobile */
  @media (max-width: 480px) {
    .main-container {
      padding: 0 6px;
      margin-left: 0; /* Reset margin for mobile */
      padding-top: 70px; /* Reduced space for smaller screen */
    }

    .content-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .left-sidebar {
      top: 4px;
      padding: 6px 12px;
      gap: 8px;
    }

    .main-logo {
      width: 100px;
    }

    .discord-link {
      font-size: 11px;
    }
  }
</style>