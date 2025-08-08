<script>
  import Input from './Input.svelte';
  import Button from './Button.svelte';

  let roomCode = '';

  function joinRoom() {
    if (roomCode.trim()) {
      window.location.href = `/${roomCode.trim()}`;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      joinRoom();
    }
  }
</script>

<div class="room-join">
  <h2 class="section-title">Join Room</h2>
  
  <div class="join-form">
    <Input
      bind:value={roomCode}
      placeholder="Enter room code"
      fullWidth={true}
      on:keydown={handleKeydown}
    />
    
    <Button 
      variant="secondary" 
      onClick={joinRoom}
      disabled={!roomCode.trim()}
      size="large"
    >
      Join
    </Button>
  </div>
</div>

<style>
  .room-join {
    background-color: #262522;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .section-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
  }

  .join-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 480px) {
    .join-form {
      flex-direction: row;
      align-items: flex-end;
    }
    
    .join-form :global(.input-container) {
      flex: 1;
    }
  }

  @media (max-width: 768px) {
    .room-join {
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 16px;
      margin-bottom: 12px;
    }
  }
</style>
