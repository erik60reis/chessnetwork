<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
</script>

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
  <slot></slot>
</div>
