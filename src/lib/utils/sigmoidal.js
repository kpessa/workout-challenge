export function calculateSigmoidal(day, params) {
  const { startMinutes, endMinutes, steepness, midpoint } = params;
  return startMinutes + (endMinutes - startMinutes) / 
    (1 + Math.exp(-steepness * (day - midpoint)));
}

export function generateWorkoutSchedule(startDate, daysPerWeek, totalDays = 90) {
  const schedule = [];
  let currentDate = new Date(startDate);
  let workoutCount = 0;

  while (workoutCount < totalDays) {
    const dayOfWeek = currentDate.getDay();
    // Assuming we want to spread workouts evenly through the week
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      schedule.push({
        date: new Date(currentDate),
        day: workoutCount + 1,
        completed: false,
        workouts: []
      });
      workoutCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}
