<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
</script>

<p class={cn('text-sm text-muted-foreground', className)}>
  <slot></slot>
</p>
