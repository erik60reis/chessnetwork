<script>
  import Select from './Select.svelte';
  import Button from './Button.svelte';

  const gameTypeOptions = [
    { value: 'chess/chess', label: 'Chess' },
    { value: 'chess/courier', label: 'Courier Chess' },
    { value: 'chess/gothic', label: 'Gothic Chess' },
    { value: 'chess/racingkings', label: 'Racing Kings' },
    { value: 'chess/antichess', label: 'Antichess' },
    { value: 'chess/3check', label: '3check Chess' },
    { value: 'chess/horde', label: 'Horde Chess' },
    { value: 'chess/amazon', label: 'Amazon Chess' },
    { value: 'chess/amazons', label: 'Amazons Chess' },
    { value: 'chess/crazyhouse', label: 'Crazyhouse Chess' },
    { value: 'chess2.0/chess2.0', label: 'Chesstraps Chess 2.0' },
    { value: 'checkers/checkers', label: 'Checkers' },
    { value: 'checkers/draughts', label: 'Draughts' }
  ];

  const timeOptions = [
    { value: '15/0', label: '0:15' },
    { value: '60/0', label: '1:00' },
    { value: '180/0', label: '3:00' },
    { value: '300/0', label: '5:00' },
    { value: '300/3', label: '5+3' },
    { value: '600/0', label: '10:00' },
    { value: '600/5', label: '10+5' },
    { value: '900/0', label: '15:00' },
    { value: '1800/0', label: '30:00' },
    { value: '3600/0', label: '1:00:00' },
    { value: '7200/0', label: '2:00:00' }
  ];

  let selectedGameType = 'chess/chess';
  let selectedTime = '900/0';

  function createNewRoom() {
    window.location.href = `/new/${selectedGameType}/${selectedTime}`;
  }
</script>

<div class="game-options">
  <h2 class="section-title">Custom Game</h2>
  
  <div class="option-group">
    <label class="option-label">Game Type</label>
    <Select
      bind:value={selectedGameType}
      options={gameTypeOptions}
      fullWidth={true}
    />
  </div>

  <div class="option-group">
    <label class="option-label">Time Control</label>
    <Select
      bind:value={selectedTime}
      options={timeOptions}
      fullWidth={true}
    />
  </div>

  <Button 
    variant="primary" 
    onClick={createNewRoom}
    size="large"
  >
    Create Room
  </Button>
</div>

<style>
  .game-options {
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

  .option-group {
    margin-bottom: 16px;
  }

  .option-label {
    display: block;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  @media (max-width: 768px) {
    .game-options {
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 16px;
      margin-bottom: 12px;
    }

    .option-group {
      margin-bottom: 12px;
    }
  }
</style>
