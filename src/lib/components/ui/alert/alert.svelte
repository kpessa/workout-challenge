<script lang="ts">
	import { alertVariants, type AlertVariants } from "./index";
	import { cn } from "$lib/utils";
	
	let className: string | undefined = undefined;
	export let variant: AlertVariants["variant"] = "default";
	export { className as class };
</script>

<div class={cn(alertVariants({ variant }), className)} {...$$restProps} role="alert">
	<slot />
</div>
