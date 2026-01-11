import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModelStateService } from '../../services/model-state.service';

@Component({
  selector: 'orcaflex-results-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-content">
      @if (selectedRiser(); as riser) {
        @if (riser.calculationResults; as results) {
          <div class="results-grid">
            <div class="result-item">
              <span class="label">Total Length</span>
              <span class="value">{{ results.totalLength | number:'1.1-1' }} m</span>
            </div>
            <div class="result-item">
              <span class="label">Max Tension</span>
              <span class="value">{{ results.maxTension | number:'1.0-0' }} kN</span>
            </div>
            <div class="result-item">
              <span class="label">Min Tension</span>
              <span class="value">{{ results.minTension | number:'1.0-0' }} kN</span>
            </div>
            <div class="result-item">
              <span class="label">TDP Position</span>
              <span class="value">
                ({{ results.tdpPosition.x | number:'1.1-1' }},
                {{ results.tdpPosition.y | number:'1.1-1' }})
              </span>
            </div>
            @if (results.sagBendRadius) {
              <div class="result-item">
                <span class="label">Sag Bend Radius</span>
                <span class="value">{{ results.sagBendRadius | number:'1.0-0' }} m</span>
              </div>
            }
            @if (results.hogBendRadius) {
              <div class="result-item">
                <span class="label">Hog Bend Radius</span>
                <span class="value">{{ results.hogBendRadius | number:'1.0-0' }} m</span>
              </div>
            }
          </div>

          @if (results.segments && results.segments.length > 0) {
            <div class="segments-section">
              <h4>Segments</h4>
              @for (segment of results.segments; track segment.name) {
                <div class="segment-row">
                  <span class="segment-name">{{ segment.name }}</span>
                  <span class="segment-length">{{ segment.length | number:'1.1-1' }} m</span>
                </div>
              }
            </div>
          }
        } @else {
          <div class="no-results">
            <p>No calculation results</p>
            <p class="hint">Click "Calculate" in the Risers panel</p>
          </div>
        }
      } @else {
        <div class="no-selection">
          Select a riser to view results
        </div>
      }
    </div>
  `,
  styles: [`
    .section-content {
      padding: 8px;
    }

    .results-grid {
      display: grid;
      gap: 8px;
    }

    .result-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--oc-bg-subtle, #f5f5f5);
      border-radius: 4px;
    }

    .label {
      font-size: 11px;
      color: var(--oc-text-secondary, #666);
    }

    .value {
      font-size: 12px;
      font-weight: 500;
      font-family: monospace;
    }

    .segments-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--oc-border-light, #eee);
    }

    .segments-section h4 {
      font-size: 11px;
      font-weight: 600;
      color: var(--oc-text-secondary, #666);
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .segment-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      border-bottom: 1px solid var(--oc-border-light, #eee);
      font-size: 12px;
    }

    .segment-row:last-child {
      border-bottom: none;
    }

    .segment-name {
      color: var(--oc-text-primary, #333);
    }

    .segment-length {
      color: var(--oc-text-secondary, #666);
      font-family: monospace;
    }

    .no-results, .no-selection {
      text-align: center;
      padding: 24px;
      color: var(--oc-text-secondary, #999);
    }

    .no-results p {
      margin: 0 0 4px 0;
      font-size: 12px;
    }

    .hint {
      font-size: 11px;
      color: var(--oc-text-tertiary, #bbb);
    }

    .no-selection {
      font-size: 12px;
    }
  `]
})
export class ResultsSectionComponent {
  private modelState = inject(ModelStateService);

  selectedRiser = this.modelState.selectedRiser;
}
