<script>
  import QRCode from './QRCode.svelte';

  export let roomId = '';
  export let status = 'Waiting for opponent...';
  export let showQR = false;
  export let shareUrl = '';

  $: roomUrl = shareUrl || `${window?.location?.origin}/l/${roomId}`;
</script>

<div class="game-status">
  <div class="status-content">
    {#if roomId && !status}
      <h2 class="room-code">Room: {roomId}</h2>
      <div class="share-url">{roomUrl}</div>
      {#if showQR}
        <QRCode text={roomUrl} size={120} />
      {/if}
    {:else if status}
      <div class="status-text">{@html status}</div>
    {/if}
  </div>
</div>

<style>
  .game-status {
    background-color: #262522;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 16px 0;
  }

  .status-content {
    color: #ffffff;
  }

  .room-code {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #7fa650;
  }

  .share-url {
    font-size: 14px;
    color: #9c9c9c;
    margin-bottom: 16px;
    word-break: break-all;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .status-text {
    font-size: 16px;
    line-height: 1.4;
  }

  .status-text :global(h1) {
    color: #ffffff;
    font-size: 18px;
    margin: 0 0 8px 0;
  }

  .status-text :global(div) {
    color: #9c9c9c;
    font-size: 14px;
    margin: 4px 0;
  }

  @media (max-width: 768px) {
    .game-status {
      padding: 16px;
      margin: 12px 0;
    }

    .room-code {
      font-size: 18px;
      margin-bottom: 10px;
    }

    .share-url {
      font-size: 12px;
      margin-bottom: 12px;
    }

    .status-text {
      font-size: 14px;
    }

    .status-text :global(h1) {
      font-size: 16px;
    }
  }
</style>
