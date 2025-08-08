<script>
  export let isVisible = false;
  export let isWhite = true;
  export let onPromote = () => {};

  const pieces = [
    { type: 'q', name: 'Queen' },
    { type: 'r', name: 'Rook' },
    { type: 'b', name: 'Bishop' },
    { type: 'n', name: 'Knight' }
  ];

  function handlePromote(pieceType) {
    onPromote(pieceType);
  }

  function handleOverlayClick() {
    // Close popup when clicking overlay (you may want to prevent this)
    // onPromote('q'); // default to queen, or handle differently
  }
</script>

{#if isVisible}
  <div class="promotion-overlay" on:click={handleOverlayClick} on:keydown={() => {}}>
    <div class="promotion-popup" on:click|stopPropagation on:keydown={() => {}}>
      <h3 class="popup-title">Choose Promotion Piece</h3>
      <div class="promotion-options">
        {#each pieces as piece}
          <button
            class="promotion-piece"
            on:click={() => handlePromote(piece.type)}
            title={piece.name}
          >
            <img
              src="/assets/chesspieces/{isWhite ? 'w' : 'b'}{piece.type.toUpperCase()}.png"
              alt={piece.name}
              class="piece-image"
            />
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .promotion-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .promotion-popup {
    background-color: #262522;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    min-width: 280px;
    text-align: center;
  }

  .popup-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    margin-top: 0;
  }

  .promotion-options {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .promotion-piece {
    width: 60px;
    height: 60px;
    background-color: #302e2b;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .promotion-piece:hover {
    border-color: #7fa650;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .piece-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 480px) {
    .promotion-popup {
      padding: 20px;
      margin: 16px;
      min-width: 0;
      max-width: calc(100vw - 32px);
    }

    .popup-title {
      font-size: 16px;
      margin-bottom: 16px;
    }

    .promotion-options {
      gap: 12px;
    }

    .promotion-piece {
      width: 50px;
      height: 50px;
      padding: 4px;
    }
  }
</style>
