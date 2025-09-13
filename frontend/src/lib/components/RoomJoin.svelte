<script>
  import Input from './Input.svelte';
  import Button from './Button.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from './index.js';
  import { Users } from 'lucide-svelte';

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

<Card>
  <CardHeader class="pb-3">
    <CardTitle class="flex items-center gap-2">
      <Users class="w-5 h-5" />
      Join Room
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div class="space-y-3">
      <Input
        bind:value={roomCode}
        placeholder="Enter room code"
        on:keydown={handleKeydown}
        class="font-mono text-center"
      />
      
      <Button 
        variant="default" 
        onClick={joinRoom}
        disabled={!roomCode.trim()}
        class="w-full"
      >
        Join Room
      </Button>
    </div>
  </CardContent>
</Card>
