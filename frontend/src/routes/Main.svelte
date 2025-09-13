<script>
  import { onMount } from 'svelte';
  import { 
    Layout, 
    GameBoard, 
    QuickPlayGrid, 
    RoomJoin, 
    GameOptions,
    Card,
    CardContent,
    Button
  } from '../lib/components';
  import { Bot, Users, Settings } from 'lucide-svelte';

  let gameBoard;
  let boardConfig = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    pieceTheme: "/assets/chesspieces/%piece%.png",
    width: 8,
    height: 8,
    isFlipped: false,
    legalMoves: {},
    onMove: () => {} // No moves allowed on main page
  };

  onMount(() => {
    // Load the gameboard script
    const script = document.createElement('script');
    script.src = '/assets/scripts/gameboard.js';
    document.head.appendChild(script);
  });
</script>

<Layout showLogo={false}>
  <div class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
    <!-- Main Content -->
    <div class="container mx-auto px-4 pb-12">
      <div class="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <!-- Left Sidebar - Navigation -->
        <div class="lg:col-span-1">
          <Card class="sticky top-6">
            <CardContent class="p-6">
              <div class="space-y-6">
                <!-- Logo -->
                <div class="text-center">
                  <button 
                    class="bg-transparent border-none p-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                    on:click={() => window.location.href = '/'}
                    on:keydown={(e) => e.key === 'Enter' && (window.location.href = '/')}
                    tabindex="0"
                  >
                    <img 
                      src="/assets/logobanner.png" 
                      alt="O Xadrez Logo" 
                      class="h-16 w-auto mx-auto"
                    />
                  </button>
                </div>

                <!-- Quick Actions -->
                <div class="space-y-3">
                  <Button variant="outline" class="w-full justify-start" on:click={() => window.open('/add-discord-bot', '_blank')}>
                    <Bot class="w-4 h-4 mr-2" />
                    Add Discord Bot
                  </Button>
                  
                  <Button variant="outline" class="w-full justify-start">
                    <Users class="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                  
                  <Button variant="outline" class="w-full justify-start">
                    <Settings class="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Center - Chess Board (Desktop Only) -->
        <div class="lg:col-span-1 hidden lg:block">
          <Card class="h-fit">
            <CardContent class="p-6">
              <div class="aspect-square bg-card rounded-lg border-2 border-border flex items-center justify-center">
                <GameBoard config={boardConfig} />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right - Game Controls -->
        <div class="lg:col-span-1">
          <div class="space-y-6">
            <QuickPlayGrid />
            <RoomJoin />
            <GameOptions />
          </div>
        </div>
      </div>
    </div>
  </div>
</Layout>

<style>
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
</style>