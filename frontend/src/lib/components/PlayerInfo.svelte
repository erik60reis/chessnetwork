<script>
  export let username = 'Guest';
  export let elo = null;
  export let time = '30:00';
  export let avatar = '/assets/iconwhite.png';
  export let isCurrentPlayer = false;
</script>

<div class="player-info" class:current-player={isCurrentPlayer}>
  <img src={avatar} alt="Player avatar" class="player-avatar" />
  <div class="player-details">
    <div class="username">
      {username}
      {#if elo}
        <span class="elo">({elo})</span>
      {/if}
    </div>
  </div>
  <div class="player-timer" class:active={isCurrentPlayer}>
    {time}
  </div>
</div>

<style>
  .player-info {
    display: flex;
    align-items: center;
    background-color: #262522;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 8px 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    width: 480px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .player-info.current-player {
    background-color: #2a4a1a;
    border: 2px solid #7fa650;
  }

  .player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    object-fit: cover;
  }

  .player-details {
    flex-grow: 1;
    min-width: 0;
  }

  .username {
    color: #ffffff;
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .elo {
    color: #9c9c9c;
    font-size: 14px;
    font-weight: normal;
  }

  .player-timer {
    font-size: 18px;
    font-weight: 600;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    border-radius: 6px;
    background-color: #57544a;
    color: #ffffff;
    text-align: center;
    padding: 8px 12px;
    min-width: 80px;
    transition: all 0.2s ease;
  }

  .player-timer.active {
    background-color: #7fa650;
    color: #ffffff;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  @media (max-width: 768px) {
    .player-info {
      padding: 10px 12px;
      margin: 6px 0;
      width: 100%;
      max-width: 480px;
    }

    .player-avatar {
      width: 32px;
      height: 32px;
    }

    .username {
      font-size: 14px;
    }

    .elo {
      font-size: 12px;
    }

    .player-timer {
      font-size: 16px;
      padding: 6px 10px;
      min-width: 70px;
    }
  }
</style>
