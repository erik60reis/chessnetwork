<script>
  import QRCode from './QRCode.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from './index.js';
  import { Copy, QrCode, Users } from 'lucide-svelte';

  export let roomId = '';
  export let status = 'Waiting for opponent...';
  export let showQR = false;
  export let shareUrl = '';

  $: roomUrl = shareUrl || `${window?.location?.origin}/l/${roomId}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(roomUrl);
  }
</script>

<Card>
  <CardContent class="p-2">
    {#if roomId && !status}
      <div class="text-center space-y-2">
        <div class="flex items-center justify-center gap-1.5">
          <Users class="w-3.5 h-3.5 text-primary" />
          <h3 class="text-xs font-semibold text-foreground">Room: {roomId}</h3>
        </div>
        
        <div class="bg-muted rounded-lg p-1.5">
          <div class="text-xs text-muted-foreground mb-0.5">Share this link:</div>
          <div class="font-mono text-xs text-foreground break-all">{roomUrl}</div>
          <button 
            on:click={copyToClipboard}
            class="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Copy class="w-2.5 h-2.5" />
            Copy Link
          </button>
        </div>
        
        {#if showQR}
          <div class="flex flex-col items-center gap-0.5">
            <div class="flex items-center gap-1 text-xs text-muted-foreground">
              <QrCode class="w-2.5 h-2.5" />
              Scan to join
            </div>
            <QRCode text={roomUrl} size={60} />
          </div>
        {/if}
      </div>
    {:else if status}
      <div class="text-center">
        <div class="text-xs text-foreground">{@html status}</div>
      </div>
    {/if}
  </CardContent>
</Card>

