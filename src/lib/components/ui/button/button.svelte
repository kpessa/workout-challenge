<script lang="ts">
	import { Button as ButtonPrimitive } from "bits-ui";
	import { buttonVariants, type ButtonVariants } from "./index";
	import { cn } from "$lib/utils";
	let className: string | undefined = undefined;
	export let variant: ButtonVariants["variant"] = "default";
	export let size: ButtonVariants["size"] = "default";
	export let builders = [];
	export { className as class };
</script>

<ButtonPrimitive.Root
	{builders}
	class={cn(buttonVariants({ variant, size, className }))}
	type="button"
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</ButtonPrimitive.Root>
