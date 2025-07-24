<script>
  // @ts-ignore
  import { Router, Link, Route } from "svelte-routing";
  
  import Main from './routes/Main.svelte';
  import Room from './routes/Room.svelte';

  export let url = "";
</script>

<link rel="stylesheet" href="./app.css">

<Router {url}>
    <Route path="/:roomId" let:params><Room roomId="{params.roomId}" /></Route>
    <Route path="/"><Main /></Route>
</Router>