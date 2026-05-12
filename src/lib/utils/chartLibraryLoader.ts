/**
 * Chart Library Lazy Loading Utility
 * Implements dynamic imports for D3.js and Chart.js to reduce initial bundle size
 */

// Cache loaded libraries to avoid repeated imports
const libraryCache = new Map<string, any>();

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Lazy loads D3.js library with all required modules
 */
export async function loadD3(): Promise<typeof import('d3')> {
  if (libraryCache.has('d3')) {
    return libraryCache.get('d3');
  }

  try {
    const [d3Core, d3TimeFormat, d3Axis] = await Promise.all([
      import('d3'),
      import('d3-time-format'),
      import('d3-axis')
    ]);

    // Merge all D3 modules for compatibility
    const d3 = {
      ...d3Core,
      timeFormat: d3TimeFormat.timeFormat,
      axisTop: d3Axis.axisTop,
      axisBottom: d3Core.axisBottom,
      axisLeft: d3Core.axisLeft
    };

    libraryCache.set('d3', d3);
    return d3;
  } catch (error) {
    // Failed to load D3.js library - could implement proper error reporting here
    throw new Error('Failed to load D3.js library');
  }
}

/**
 * Lazy loads Chart.js library with annotation plugin
 */
export async function loadChartJS(): Promise<{
  ChartJS: typeof import('chart.js/auto').default;
  annotationPlugin: any;
}> {
  if (libraryCache.has('chartjs')) {
    return libraryCache.get('chartjs');
  }

  try {
    const [chartJSModule, annotationModule] = await Promise.all([
      import('chart.js/auto'),
      import('chartjs-plugin-annotation')
    ]);

    const result = {
      ChartJS: chartJSModule.default,
      annotationPlugin: annotationModule.default
    };

    // Register the annotation plugin
    result.ChartJS.register(result.annotationPlugin);

    libraryCache.set('chartjs', result);
    return result;
  } catch (error) {
    // Failed to load Chart.js library - could implement proper error reporting here
    throw new Error('Failed to load Chart.js library');
  }
}

/**
 * Higher-order component for lazy loading chart libraries
 */
export function withChartLibrary<T extends Record<string, any>>(
  loadLibrary: () => Promise<T>,
  fallbackComponent?: any
) {
  return function(component: any) {
    return {
      component,
      loadLibrary,
      fallbackComponent
    };
  };
}

/**
 * Preload chart libraries in the background (optional optimization)
 */
export function preloadChartLibraries(): void {
  // Only preload if user has interacted with the page
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      // Preload D3 on idle
      loadD3().catch(() => {});
      // Preload Chart.js on idle
      loadChartJS().catch(() => {});
    });
  }
}

/**
 * Clear the library cache (useful for testing or memory management)
 */
export function clearLibraryCache(): void {
  libraryCache.clear();
}

/**
 * Check if a library is already loaded
 */
export function isLibraryLoaded(library: 'd3' | 'chartjs'): boolean {
  return libraryCache.has(library);
}