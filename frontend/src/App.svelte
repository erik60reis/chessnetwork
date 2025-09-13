<script>
  // @ts-ignore
  import { Router, Link, Route } from "svelte-routing";
  import { onMount } from 'svelte';
  
  import Main from './routes/Main.svelte';
  import Room from './routes/Room.svelte';

  export let url = "";

  onMount(() => {
    // Apply dark theme by default
    document.documentElement.classList.add('dark');
  });
</script>

<link rel="stylesheet" href="./app.css">

<div class="dark">
  <Router {url}>
      <Route path="/:roomId" let:params><Room roomId="{params.roomId}" /></Route>
      <Route path="/"><Main /></Route>
  </Router>
</div>