<script>
  import Button from './Button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from './index.js';
  import { Clock } from 'lucide-svelte';

  const timeControls = [
    { display: '1+0', time: 1, increment: 0, category: 'bullet' },
    { display: '2+1', time: 2, increment: 1, category: 'bullet' },
    { display: '3+0', time: 3, increment: 0, category: 'bullet' },
    { display: '3+2', time: 3, increment: 2, category: 'blitz' },
    { display: '5+0', time: 5, increment: 0, category: 'blitz' },
    { display: '5+3', time: 5, increment: 3, category: 'blitz' },
    { display: '10+0', time: 10, increment: 0, category: 'rapid' },
    { display: '10+5', time: 10, increment: 5, category: 'rapid' },
    { display: '15+10', time: 15, increment: 10, category: 'rapid' },
    { display: '30+0', time: 30, increment: 0, category: 'classical' },
    { display: '30+20', time: 30, increment: 20, category: 'classical' }
  ];

  function handleQuickPlay(timeControl) {
    const timeInSeconds = timeControl.time * 60;
    window.location.href = `/quickplay/${timeInSeconds}/${timeControl.increment}`;
  }

  function getCategoryColor(category) {
    switch (category) {
      case 'bullet': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'blitz': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'rapid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'classical': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  }
</script>

<Card>
  <CardHeader class="pb-3">
    <CardTitle class="flex items-center gap-2">
      <Clock class="w-5 h-5" />
      Quick Play
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="grid grid-cols-3 gap-2">
      {#each timeControls as timeControl}
        <Button 
          variant="outline" 
          onClick={() => handleQuickPlay(timeControl)}
          size="sm"
          class="h-8 text-xs font-mono {getCategoryColor(timeControl.category)} hover:scale-105 transition-transform"
        >
          {timeControl.display}
        </Button>
      {/each}
    </div>
  </CardContent>
</Card>
