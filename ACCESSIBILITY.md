# Accessibility Features Documentation

This document describes the comprehensive accessibility features implemented in the workout-challenge application's chart components.

## Overview

All chart components have been enhanced to meet WCAG 2.1 AA compliance standards with:
- Full keyboard navigation support
- Screen reader compatibility
- Alternative data table views
- High contrast mode support
- Reduced motion preferences
- ARIA labels and descriptions
- Live announcements for interactions

## Chart Components Accessibility Features

### 1. ProgressChart Components

#### Core Features
- **Keyboard Navigation**: Full arrow key navigation through chart elements
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Data Table Alternative**: Toggle between chart and accessible table view
- **Live Announcements**: Real-time feedback for user actions
- **Focus Indicators**: Clear visual indicators for focused elements

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Enter chart navigation mode |
| `Arrow Keys` | Navigate between chart elements |
| `Enter` | Select/activate current element |
| `Space` | Alternative selection key |
| `Home` | Go to first element |
| `End` | Go to last element |
| `Escape` | Exit navigation mode |

#### Usage
```svelte
<ProgressChartCore
  {dailyWorkouts}
  {viewMode}
  {containerWidth}
  {containerHeight}
  {workoutTypesData}
  {currentPage}
  {showDataTable}
  on:workoutClick={handleWorkoutClick}
  on:editWorkout={handleEditWorkout}
  on:deleteWorkout={handleDeleteWorkout}
  on:dateClick={handleDateClick}
/>
```

### 2. AnalyticsGraph Component

#### Core Features
- **Data Table Toggle**: Switch between chart and table views
- **Keyboard Shortcuts**: Built-in help and navigation
- **ARIA Descriptions**: Comprehensive chart summaries
- **Live Region**: Announcements for state changes

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `h` | Show help/keyboard shortcuts |
| `t` | Toggle data table view |
| `Tab` | Navigate to interactive elements |

#### Usage
```svelte
<AnalyticsGraph {startDate} />
```

### 3. ChartNavigation Component

#### Features
- **ARIA Toolbar**: Properly labeled navigation controls
- **Button States**: Clear indication of disabled states
- **Context Awareness**: Navigation state announcements

### 4. ChartLegend Component

#### Features
- **Legend Semantics**: Proper role and labeling for color indicators
- **Control Grouping**: Logical grouping of related controls
- **Toggle Controls**: Accessible data table toggle

## Accessibility Utilities

### chartAccessibility.ts

This utility module provides:

#### Key Functions
- `generateChartDescription()`: Creates comprehensive chart descriptions
- `generateWorkoutBarLabel()`: Labels for workout bars
- `generateProposedBarLabel()`: Labels for proposed workouts
- `generateDateLabel()`: Labels for date areas
- `createKeyboardNavigationHandler()`: Sets up keyboard navigation
- `generateDataTableHTML()`: Creates accessible data tables
- `createLiveRegion()`: Sets up announcement regions
- `updateChartAccessibility()`: Updates accessibility attributes

#### Example Usage
```typescript
import {
  generateChartDescription,
  createKeyboardNavigationHandler,
  createLiveRegion
} from '$lib/utils/chartAccessibility';

// Generate description
const description = generateChartDescription(dailyWorkouts, viewMode, currentPage);

// Set up keyboard navigation
const cleanup = createKeyboardNavigationHandler(
  chartContainer,
  dailyWorkouts,
  workoutTypesData,
  handleElementSelect,
  announceMessage
);

// Create live region
const { announce, cleanup: liveCleanup } = createLiveRegion(container);
```

## Data Table Alternatives

### Features
- **Semantic HTML**: Proper table structure with headers
- **Sortable Columns**: Screen reader accessible sorting
- **Sticky Headers**: Headers remain visible during scroll
- **Keyboard Navigation**: Full keyboard accessibility
- **Responsive Design**: Mobile-friendly table layout

### Table Structure
```html
<table class="data-table" aria-label="Workout data table">
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Day</th>
      <th scope="col">Workouts</th>
      <th scope="col">Total Minutes</th>
      <th scope="col">Proposed Minutes</th>
    </tr>
  </thead>
  <tbody>
    <!-- Data rows -->
  </tbody>
</table>
```

## ARIA Labels and Descriptions

### Chart Container
```html
<div
  role="application"
  aria-label="Workout progress chart. Press Tab to begin navigation."
  aria-description="Comprehensive chart description with data summary"
  tabindex="0"
>
```

### Interactive Elements
```html
<!-- Workout bars -->
<rect
  role="button"
  aria-label="Running workout on 12/26/2024, 30 minutes. Press Enter to edit."
  data-workout-id="123"
  tabindex="-1"
/>

<!-- Proposed workouts -->
<rect
  role="button"
  aria-label="Proposed workout on 12/27/2024, 25 minutes. Press Enter to log."
  data-proposed-date="2024-12-27"
  tabindex="-1"
/>

<!-- Date areas -->
<rect
  role="button"
  aria-label="12/28/2024, no workouts. Press Enter to add workout."
  data-date="2024-12-28"
  tabindex="-1"
/>
```

## Screen Reader Support

### Announcements
- **Navigation State**: "Chart navigation activated"
- **Element Focus**: Detailed descriptions of focused elements
- **Actions**: Confirmation of user actions
- **Boundaries**: "End of chart reached" notifications

### Live Regions
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Dynamic announcements appear here -->
</div>
```

## Visual Accessibility

### Focus Indicators
```css
.chart-element-focused {
  outline: 3px solid hsl(var(--primary));
  outline-offset: 2px;
  filter: brightness(1.2) drop-shadow(0 0 4px hsl(var(--primary)));
}
```

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .chart-element-focused {
    outline: 4px solid yellow;
    outline-offset: 3px;
  }
  
  .completed-rect {
    stroke-width: 2px;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .completed-rect,
  .proposed-rect {
    transition: none;
  }
}
```

## Testing Checklist

### Screen Reader Testing
- [ ] Chart description read on focus
- [ ] Navigation instructions announced
- [ ] Element details spoken clearly
- [ ] State changes announced
- [ ] Data table properly read
- [ ] All interactive elements labeled

### Keyboard Navigation Testing
- [ ] Tab to enter chart navigation
- [ ] Arrow keys navigate elements
- [ ] Enter/Space activates elements
- [ ] Home/End navigate to boundaries
- [ ] Escape exits navigation
- [ ] All controls reachable by keyboard

### Visual Testing
- [ ] Focus indicators visible
- [ ] High contrast mode functional
- [ ] Reduced motion respected
- [ ] Color not only means of information
- [ ] Sufficient color contrast ratios

### Integration Testing
- [ ] Works with popular screen readers (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation smooth
- [ ] Mobile accessibility functional
- [ ] Table view accessible
- [ ] Live announcements working

## Browser Support

### Tested Browsers
-  Chrome (latest)
-  Firefox (latest)
-  Safari (latest)
-  Edge (latest)

### Screen Reader Support
-  NVDA (Windows)
-  JAWS (Windows)
-  VoiceOver (macOS/iOS)
-  TalkBack (Android)

## Implementation Notes

### Performance Considerations
- Accessibility features are lightweight and performant
- Keyboard navigation uses event delegation
- ARIA updates are batched to prevent spam
- Data tables are lazily generated

### Backwards Compatibility
- All accessibility features are progressive enhancements
- Charts remain functional without accessibility features
- No breaking changes to existing APIs

### Future Enhancements
- Voice command support
- Gesture navigation for mobile
- Braille display optimization
- Enhanced cognitive accessibility features

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Contributing

When adding new chart features:
1. Include ARIA labels and descriptions
2. Ensure keyboard accessibility
3. Test with screen readers
4. Update this documentation
5. Add accessibility tests

## Support

For accessibility-related issues:
1. Check this documentation
2. Test with multiple screen readers
3. Verify keyboard navigation
4. Review ARIA attributes
5. File detailed bug reports with accessibility impact assessment