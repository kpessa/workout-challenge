<script>
  import { userPreferences } from '../stores/userPreferencesStore';
  
  let localParams = $userPreferences.sigmoidParams;
  let localDaysPerWeek = $userPreferences.daysPerWeek;
  let localStartDate = new Date($userPreferences.startDate).toISOString().split('T')[0];

  function updateParams() {
    userPreferences.updateSigmoidParams(localParams);
  }

  function updateDaysPerWeek() {
    userPreferences.setDaysPerWeek(localDaysPerWeek);
  }

  function updateStartDate(event) {
    const date = new Date(event.target.value);
    if (!isNaN(date.getTime())) {
      userPreferences.setStartDate(date.toISOString());
    }
  }

  function resetToDefaults() {
    userPreferences.reset();
    localParams = $userPreferences.sigmoidParams;
    localDaysPerWeek = $userPreferences.daysPerWeek;
    localStartDate = new Date($userPreferences.startDate).toISOString().split('T')[0];
  }
</script>

<div class="controls-panel">
  <h2>Challenge Settings</h2>
  
  <div class="control-section">
    <h3>Schedule</h3>
    <div class="control-group">
      <label>
        Start Date:
        <input 
          type="date" 
          bind:value={localStartDate}
          on:change={updateStartDate}
        />
      </label>
    </div>
    
    <div class="control-group">
      <label>
        Workouts per Week:
        <input 
          type="number" 
          min="1" 
          max="7" 
          bind:value={localDaysPerWeek} 
          on:change={updateDaysPerWeek}
        />
      </label>
    </div>
  </div>

  <div class="control-section">
    <h3>Progression Settings</h3>
    <div class="control-group">
      <label>
        Starting Duration (minutes):
        <input 
          type="number" 
          min="1" 
          max="120" 
          bind:value={localParams.startMinutes} 
          on:change={updateParams}
        />
      </label>
    </div>

    <div class="control-group">
      <label>
        Target Duration (minutes):
        <input 
          type="number" 
          min="1" 
          max="180" 
          bind:value={localParams.endMinutes} 
          on:change={updateParams}
        />
      </label>
    </div>

    <div class="control-group">
      <label>
        Progression Steepness:
        <input 
          type="range" 
          min="0.01" 
          max="0.2" 
          step="0.01" 
          bind:value={localParams.steepness} 
          on:change={updateParams}
        />
        <span class="value-display">{localParams.steepness.toFixed(2)}</span>
      </label>
    </div>

    <div class="control-group">
      <label>
        Midpoint (day):
        <input 
          type="range" 
          min="1" 
          max="90" 
          bind:value={localParams.midpoint} 
          on:change={updateParams}
        />
        <span class="value-display">Day {localParams.midpoint}</span>
      </label>
    </div>
  </div>

  <div class="control-section">
    <button class="reset-button" on:click={resetToDefaults}>
      Reset to Defaults
    </button>
  </div>
</div>

<style>
  .controls-panel {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .control-section {
    margin: 1.5rem 0;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }

  .control-group {
    margin: 1rem 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: var(--text-muted);
  }

  input {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: inherit;
  }

  input[type="range"] {
    width: 100%;
  }

  .value-display {
    font-size: 0.9em;
    color: var(--text-muted);
  }

  .reset-button {
    width: 100%;
    padding: 0.75rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .reset-button:hover {
    background: #ff2d00;
  }

  h2, h3 {
    margin: 0 0 1rem 0;
  }

  h3 {
    color: var(--text-muted);
    font-size: 1.1em;
  }

  @media (max-width: 768px) {
    .controls-panel {
      padding: 1rem;
    }
  }
</style>
