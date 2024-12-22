<script lang="ts">
	import { cn } from "$lib/utils";
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { toggleVariants } from "./index.js";

	type VariantType = "default" | "outline";
	type SizeType = "default" | "sm" | "lg";

	let className: string | undefined | null = undefined;
	export { className as class };
	export let pressed = false;
	export let variant: VariantType = "default";
	export let size: SizeType = "default";
	export let isTotal = false;
</script>

<TogglePrimitive.Root
	class={cn(toggleVariants({ variant, size, className }), isTotal ? 'total-button' : '')}
	bind:pressed
	on:click
	{...$$restProps}
>
	<slot />
</TogglePrimitive.Root>
