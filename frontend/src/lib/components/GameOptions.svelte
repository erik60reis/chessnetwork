<script>
  import Select from './Select.svelte';
  import Button from './Button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from './index.js';
  import { Settings } from 'lucide-svelte';

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

<Card>
  <CardHeader class="pb-3">
    <CardTitle class="flex items-center gap-2">
      <Settings class="w-5 h-5" />
      Custom Game
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Game Type</label>
        <Select
          bind:value={selectedGameType}
          options={gameTypeOptions}
          fullWidth={true}
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Time Control</label>
        <Select
          bind:value={selectedTime}
          options={timeOptions}
          fullWidth={true}
        />
      </div>

      <Button 
        variant="default" 
        onClick={createNewRoom}
        class="w-full"
      >
        Create Room
      </Button>
    </div>
  </CardContent>
</Card>
