<script lang="ts">
	import { cn } from "$lib/utils";
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { toggleVariants } from "./index.js";

	let className: string | undefined | null = undefined;
	export { className as class };
	export let pressed = false;
	export let variant: "default" | "outline" = "default";
	export let size: "default" | "sm" | "lg" = "default";
</script>

<TogglePrimitive.Root
	class={cn(toggleVariants({ variant, size, className }))}
	bind:pressed
	on:click
	{...$$restProps}
>
	<slot />
</TogglePrimitive.Root>
