/**
 * Console log capture and export utility
 * Captures all console output and allows exporting to a file via hotkey
 */

interface CapturedLog {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  data?: any[];
}

class LogCapture {
  private logs: CapturedLog[] = [];
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };
  private isEnabled = true;

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    
    this.setupConsoleOverrides();
    this.setupHotkey();
  }

  private setupConsoleOverrides() {
    const captureLog = (level: CapturedLog['level'], originalMethod: Function) => {
      return (...args: any[]) => {
        // Call original console method
        originalMethod.apply(console, args);
        
        // Capture the log if enabled
        if (this.isEnabled) {
          this.captureLog(level, args);
        }
      };
    };

    console.log = captureLog('log', this.originalConsole.log);
    console.error = captureLog('error', this.originalConsole.error);
    console.warn = captureLog('warn', this.originalConsole.warn);
    console.info = captureLog('info', this.originalConsole.info);
    console.debug = captureLog('debug', this.originalConsole.debug);
  }

  private captureLog(level: CapturedLog['level'], args: any[]) {
    const timestamp = new Date().toISOString();
    
    // Serialize the arguments
    const message = args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      } else if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      } else if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object - JSON serialization failed]';
        }
      } else {
        return String(arg);
      }
    }).join(' ');

    this.logs.push({
      timestamp,
      level,
      message,
      data: args
    });

    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  private setupHotkey() {
    document.addEventListener('keydown', (event) => {
      // Check for CTRL+SHIFT+L
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        this.exportLogs();
      }
    });
  }

  private formatLogsForExport(): string {
    const header = `Console Log Export
Generated: ${new Date().toISOString()}
Total logs: ${this.logs.length}
========================================

`;

    const logLines = this.logs.map(log => {
      const levelPrefix = `[${log.level.toUpperCase()}]`;
      const timePrefix = `[${log.timestamp}]`;
      return `${timePrefix} ${levelPrefix} ${log.message}`;
    }).join('\n');

    return header + logLines;
  }

  private exportLogs() {
    const logContent = this.formatLogsForExport();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).replace(/[:\s]/g, '').toLowerCase(); // "136pm"
    const dateString = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }).replace(/[,\s]/g, ''); // "Jan6"
    const filename = `${timeString}.log`;
    
    // Create and download the file
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;  // Let browser save to downloads, user can move manually
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show confirmation
    console.log(`📝 Exported ${this.logs.length} console logs to ${filename}`);
    console.log('💡 Press CTRL+SHIFT+L anytime to export logs again');
  }

  public enable() {
    this.isEnabled = true;
    console.log('📝 Console log capture enabled');
  }

  public disable() {
    this.isEnabled = false;
    console.log('📝 Console log capture disabled');
  }

  public clearLogs() {
    this.logs = [];
    console.log('📝 Console log history cleared');
  }

  public getLogCount(): number {
    return this.logs.length;
  }
}

// Create global instance
let logCapture: LogCapture | null = null;

export function initializeLogCapture() {
  if (!logCapture) {
    logCapture = new LogCapture();
    console.log('📝 Console log capture initialized');
    console.log('💡 Press CTRL+SHIFT+L to export all console logs to a file');
  }
  return logCapture;
}

export function getLogCapture(): LogCapture | null {
  return logCapture;
}