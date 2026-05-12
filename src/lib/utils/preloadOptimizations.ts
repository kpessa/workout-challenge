/**
 * Preload optimizations for better perceived performance
 * Loads heavy libraries in the background when the user is idle
 */

import { preloadChartLibraries, isLibraryLoaded } from './chartLibraryLoader';

export interface PreloadConfig {
  preloadOnIdle: boolean;
  preloadOnInteraction: boolean;
  preloadAfterDelay: number; // milliseconds
}

const defaultConfig: PreloadConfig = {
  preloadOnIdle: true,
  preloadOnInteraction: true,
  preloadAfterDelay: 3000 // 3 seconds
};

let hasUserInteracted = false;
let preloadInitiated = false;

/**
 * Initialize preloading optimizations
 */
export function initializePreloading(config: Partial<PreloadConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (typeof window === 'undefined') return;
  
  // Track user interactions
  if (finalConfig.preloadOnInteraction) {
    setupInteractionTracking();
  }
  
  // Preload on idle
  if (finalConfig.preloadOnIdle && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      if (!preloadInitiated) {
        preloadChartLibraries();
        preloadInitiated = true;
      }
    }, { timeout: 2000 });
  }
  
  // Preload after delay
  if (finalConfig.preloadAfterDelay > 0) {
    setTimeout(() => {
      if (!preloadInitiated) {
        preloadChartLibraries();
        preloadInitiated = true;
      }
    }, finalConfig.preloadAfterDelay);
  }
}

/**
 * Setup interaction tracking for intelligent preloading
 */
function setupInteractionTracking() {
  const interactionEvents = ['mouseenter', 'touchstart', 'scroll', 'keydown'];
  
  const handleFirstInteraction = () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      
      // Preload after user shows intent to interact
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          if (!preloadInitiated) {
            preloadChartLibraries();
            preloadInitiated = true;
          }
        });
      }
      
      // Remove listeners after first interaction
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction, { passive: true });
      });
    }
  };
  
  // Add passive listeners for better performance
  interactionEvents.forEach(event => {
    document.addEventListener(event, handleFirstInteraction, { passive: true });
  });
}

/**
 * Preload chart libraries when hovering over chart containers
 */
export function setupChartHoverPreload() {
  if (typeof window === 'undefined') return;
  
  // Use event delegation for better performance
  document.addEventListener('mouseenter', (event) => {
    const target = event.target as HTMLElement;
    
    // Check if hovering over a chart container
    if (target.closest('[data-chart-container]') || 
        target.closest('.progress-chart-container') ||
        target.closest('.analytics-graph')) {
      
      if (!isLibraryLoaded('d3') || !isLibraryLoaded('chartjs')) {
        // Preload with low priority
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => {
            preloadChartLibraries();
          });
        }
      }
    }
  }, { passive: true });
}

/**
 * Get preload status for debugging
 */
export function getPreloadStatus() {
  return {
    hasUserInteracted,
    preloadInitiated,
    d3Loaded: isLibraryLoaded('d3'),
    chartJSLoaded: isLibraryLoaded('chartjs')
  };
}

/**
 * Force preload chart libraries (for testing or manual triggers)
 */
export function forcePreloadChartLibraries() {
  preloadChartLibraries();
  preloadInitiated = true;
}

/**
 * Reset preload state (for testing)
 */
export function resetPreloadState() {
  hasUserInteracted = false;
  preloadInitiated = false;
}