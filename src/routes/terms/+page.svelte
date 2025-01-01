<script lang="ts">
  import { Button } from "$lib/components/UI/button";
  import { ArrowLeft } from "lucide-svelte";
  import { goto } from "$app/navigation";
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
  <Button variant="ghost" class="mb-6" on:click={() => goto("/")}>
    <ArrowLeft class="mr-2 h-4 w-4" />
    Back
  </Button>

  <h1 class="text-3xl font-bold mb-6">Terms of Service</h1>
  
  <div class="prose dark:prose-invert max-w-none">
    <p class="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
      <p>By accessing and using the Workout Challenge app, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">2. Description of Service</h2>
      <p>Workout Challenge is a fitness tracking application that allows users to log and track their workout activities. We provide this service subject to these Terms.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">3. User Accounts</h2>
      <ul class="list-disc pl-6 mb-4">
        <li>You must provide accurate and complete information when creating an account</li>
        <li>You are responsible for maintaining the security of your account</li>
        <li>You must notify us immediately of any unauthorized use of your account</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">4. User Conduct</h2>
      <p>You agree not to:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Use the service for any unlawful purpose</li>
        <li>Attempt to gain unauthorized access to any part of the service</li>
        <li>Interfere with or disrupt the service</li>
        <li>Share your account credentials with others</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
      <p>The service and its original content, features, and functionality are owned by Kurt Pessa and are protected by international copyright, trademark, and other intellectual property laws.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">6. Termination</h2>
      <p>We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the service, us, or third parties, or for any other reason.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">7. Disclaimer</h2>
      <p>The service is provided "as is" without any warranties, expressed or implied. We do not warrant that the service will be uninterrupted or error-free.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
      <p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
      <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">10. Contact Information</h2>
      <p>If you have any questions about these Terms, please contact us.</p>
    </section>
  </div>
</div> 