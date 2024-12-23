import { supabase } from './supabase.test';
import { userPreferences, type UserPreferences } from './userPreferencesStore.test';

async function main() {
  try {
    // Sign up a test user
    const email = `test${Date.now()}@example.com`;
    const password = 'testpassword123';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      throw new Error(`Failed to sign up test user: ${signUpError.message}`);
    }

    console.log('Test user created successfully');

    // Initialize preferences
    await userPreferences.initialize();
    console.log('Preferences initialized');

    // Update preferences
    const testPreferences: UserPreferences = {
      startDate: '2024-01-01T00:00:00.000Z',
      daysPerWeek: 5,
      sigmoidParams: {
        a: 2,
        b: 0.7,
        c: 7,
        d: 2
      }
    };

    await userPreferences.set(testPreferences);
    console.log('Preferences updated');

    // Verify preferences in database
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_preferences')
      .select('data')
      .eq('user_id', signUpData.user!.id)
      .single();

    if (verifyError) {
      throw new Error(`Failed to verify preferences: ${verifyError.message}`);
    }

    console.log('Preferences verified in database:', verifyData.data);

    // Reset preferences
    await userPreferences.reset();
    console.log('Preferences reset');

    // Clean up
    await supabase.auth.signOut();
    console.log('Test completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main(); 