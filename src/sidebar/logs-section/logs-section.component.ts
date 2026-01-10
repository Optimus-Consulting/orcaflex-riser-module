import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelStateService } from '../../services/model-state.service';

@Component({
  selector: 'orcaflex-logs-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-content">
      <div class="toolbar">
        <button class="clear-btn" (click)="clearLogs()" [disabled]="logs().length === 0">
          Clear Logs
        </button>
      </div>

      <div class="logs-container">
        @for (log of logs(); track log.id) {
          <div class="log-entry" [class]="log.level">
            <span class="timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="level-badge">{{ log.level }}</span>
            <span class="message">{{ log.message }}</span>
            @if (log.details) {
              <div class="details">{{ log.details }}</div>
            }
          </div>
        }

        @if (logs().length === 0) {
          <div class="empty-state">
            No log entries
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .section-content {
      padding: 8px;
    }

    .toolbar {
      margin-bottom: 8px;
    }

    .clear-btn {
      padding: 4px 8px;
      font-size: 11px;
      border: 1px solid var(--caris-border-light, #ddd);
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .clear-btn:hover:not(:disabled) {
      background: var(--caris-bg-subtle, #f5f5f5);
    }

    .clear-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .logs-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--caris-border-light, #eee);
      border-radius: 4px;
      background: var(--caris-bg-subtle, #fafafa);
    }

    .log-entry {
      padding: 6px 8px;
      border-bottom: 1px solid var(--caris-border-light, #eee);
      font-size: 11px;
      font-family: monospace;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .timestamp {
      color: var(--caris-text-tertiary, #999);
      margin-right: 8px;
    }

    .level-badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10px;
      text-transform: uppercase;
      margin-right: 8px;
    }

    .log-entry.info .level-badge {
      background: #e3f2fd;
      color: #1976d2;
    }

    .log-entry.success .level-badge {
      background: #e8f5e9;
      color: #388e3c;
    }

    .log-entry.warning .level-badge {
      background: #fff3e0;
      color: #f57c00;
    }

    .log-entry.error .level-badge {
      background: #ffebee;
      color: #d32f2f;
    }

    .message {
      color: var(--caris-text-primary, #333);
    }

    .details {
      margin-top: 4px;
      padding: 4px 8px;
      background: rgba(0,0,0,0.03);
      border-radius: 2px;
      color: var(--caris-text-secondary, #666);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .empty-state {
      padding: 20px;
      text-align: center;
      color: var(--caris-text-tertiary, #bbb);
      font-size: 12px;
    }
  `]
})
export class LogsSectionComponent {
  private modelState = inject(ModelStateService);

  logs = this.modelState.logs;

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  clearLogs(): void {
    this.modelState.clearLogs();
  }
}
