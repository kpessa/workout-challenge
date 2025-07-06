<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import { ArrowLeft } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import type { PageData } from './$types';
  
  export let data: PageData;
  export let form: any = undefined;
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
  <Button variant="ghost" class="mb-6" on:click={() => goto("/")}>
    <ArrowLeft class="mr-2 h-4 w-4" />
    Back
  </Button>

  <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>
  
  <div class="prose dark:prose-invert max-w-none">
    <p class="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Introduction</h2>
      <p>Welcome to the Workout Challenge app. We respect your privacy and are committed to protecting your personal data.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Information We Collect</h2>
      <p>We collect information that you provide directly to us:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Email address and authentication information</li>
        <li>Workout data and activity logs</li>
        <li>User preferences and settings</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Provide, maintain, and improve our services</li>
        <li>Process and track your workouts</li>
        <li>Send you technical notices and support messages</li>
        <li>Respond to your comments and questions</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information. Your data is stored securely using industry-standard encryption and security practices.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Third-Party Services</h2>
      <p>We use Firebase for authentication and data storage. Their privacy policy can be found on their website.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Your Rights</h2>
      <p>You have the right to:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Withdraw consent at any time</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us.</p>
    </section>
  </div>
</div> 