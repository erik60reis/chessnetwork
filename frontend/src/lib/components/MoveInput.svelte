<script>
  import Input from './Input.svelte';
  import Button from './Button.svelte';

  export let onMove = () => {};
  export let placeholder = "Enter move... (e.g. e2e4 or 21-17)";
  export let disabled = false;

  let moveValue = '';

  function handleMove() {
    if (moveValue.trim()) {
      onMove(moveValue.trim());
      moveValue = '';
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      handleMove();
    }
  }
</script>

<div class="move-input">
  <Input
    bind:value={moveValue}
    {placeholder}
    {disabled}
    fullWidth={true}
    on:keydown={handleKeydown}
  />
  
  <Button 
    variant="primary" 
    onClick={handleMove}
    disabled={disabled || !moveValue.trim()}
  >
    Move
  </Button>
</div>

<style>
  .move-input {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    margin: 16px 0;
  }

  .move-input :global(.input-container) {
    flex: 1;
  }

  @media (max-width: 480px) {
    .move-input {
      flex-direction: column;
      gap: 12px;
      margin: 12px 0;
    }
  }
</style>
