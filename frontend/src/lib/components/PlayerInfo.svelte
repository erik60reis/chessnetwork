<script>
  import { cn } from '../utils.js';
  import { Crown, Clock } from 'lucide-svelte';
  
  let className = '';
  export { className as class };
  
  export let username = 'Guest';
  export let elo = null;
  export let time = '30:00';
  export let avatar = '/assets/iconwhite.png';
  export let isCurrentPlayer = false;
</script>

<div class={cn(
  'flex items-center gap-2 bg-card border rounded-lg p-2 transition-all duration-200',
  isCurrentPlayer && 'border-primary bg-primary/5 shadow-lg',
  className
)}>
  <div class="relative">
    <img 
      src={avatar} 
      alt="Player avatar" 
      class="w-7 h-7 rounded-full object-cover border border-border"
    />
    {#if isCurrentPlayer}
      <Crown class="absolute -top-0.5 -right-0.5 w-3 h-3 text-primary fill-primary" />
    {/if}
  </div>
  
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-1">
      <span class="font-medium text-foreground truncate text-sm">{username}</span>
      {#if elo}
        <span class="text-xs text-muted-foreground">({elo})</span>
      {/if}
    </div>
  </div>
  
  <div class={cn(
    'flex items-center gap-1 px-2 py-1 rounded-md font-mono text-sm font-medium transition-all',
    isCurrentPlayer 
      ? 'bg-primary text-primary-foreground animate-pulse' 
      : 'bg-muted text-muted-foreground'
  )}>
    <Clock class="w-3 h-3" />
    {time}
  </div>
</div>

