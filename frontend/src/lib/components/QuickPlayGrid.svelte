<script>
  import Button from './Button.svelte';

  const timeControls = [
    { display: '1+0', time: 1, increment: 0 },
    { display: '2+1', time: 2, increment: 1 },
    { display: '3+0', time: 3, increment: 0 },
    { display: '3+2', time: 3, increment: 2 },
    { display: '5+0', time: 5, increment: 0 },
    { display: '5+3', time: 5, increment: 3 },
    { display: '10+0', time: 10, increment: 0 },
    { display: '10+5', time: 10, increment: 5 },
    { display: '15+10', time: 15, increment: 10 },
    { display: '30+0', time: 30, increment: 0 },
    { display: '30+20', time: 30, increment: 20 }
  ];

  function handleQuickPlay(timeControl) {
    const timeInSeconds = timeControl.time * 60;
    window.location.href = `/quickplay/${timeInSeconds}/${timeControl.increment}`;
  }
</script>

<div class="quick-play-grid">
  <h2 class="grid-title">Quick Play</h2>
  <div class="grid-container">
    {#each timeControls as timeControl}
      <Button 
        variant="secondary" 
        onClick={() => handleQuickPlay(timeControl)}
        size="small"
      >
        {timeControl.display}
      </Button>
    {/each}
  </div>
</div>

<style>
  .quick-play-grid {
    margin-bottom: 24px;
  }

  .grid-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    text-align: center;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  @media (max-width: 768px) {
    .grid-container {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .grid-title {
      font-size: 16px;
      margin-bottom: 16px;
    }
  }

  @media (max-width: 480px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
  }
</style>
