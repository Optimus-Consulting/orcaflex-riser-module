import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  CatenaryRequest,
  CatenaryResult,
  LazyWaveRequest,
  LazyWaveResult,
  ParseYamlResponse,
  GenerateYamlRequest,
  ModelValidationResult,
  VesselExtractResponse,
} from '../types';

/**
 * API service for OrcaFlex calculations and YAML operations.
 * Uses the ModuleApiService provided by CARIS host application,
 * or falls back to HttpClient for standalone testing.
 */
@Injectable({ providedIn: 'root' })
export class OrcaFlexApiService {
  private httpClient = inject(HttpClient);
  private externalApiService: any = null;

  /**
   * Initialize with the CARIS module API service (optional)
   */
  setApiService(api: any): void {
    this.externalApiService = api;
  }

  // Calculation endpoints
  async calculateCatenary(request: CatenaryRequest): Promise<CatenaryResult> {
    return this.post<CatenaryResult>('/api/orcaflex/calculate/catenary', request);
  }

  async calculateLazyWave(request: LazyWaveRequest): Promise<LazyWaveResult> {
    return this.post<LazyWaveResult>('/api/orcaflex/calculate/lazy-wave', request);
  }

  // YAML operations
  async parseYaml(content: string): Promise<ParseYamlResponse> {
    return this.post<ParseYamlResponse>('/api/orcaflex/parse', { content });
  }

  async parseVesselFromYaml(content: string | File): Promise<VesselExtractResponse> {
    const contentStr = content instanceof File ? await content.text() : content;
    return this.post<VesselExtractResponse>('/api/orcaflex/parse-vessel', { content: contentStr });
  }

  async generateYaml(request: GenerateYamlRequest): Promise<{ yaml: string }> {
    return this.post<{ yaml: string }>('/api/orcaflex/generate', request);
  }

  async downloadYaml(request: GenerateYamlRequest): Promise<Blob> {
    if (this.externalApiService) {
      return this.externalApiService.post(
        '/api/orcaflex/generate/download',
        request,
        { responseType: 'blob' }
      );
    }
    return firstValueFrom(
      this.httpClient.post('/api/orcaflex/generate/download', request, { responseType: 'blob' })
    );
  }

  async validateModel(model: any): Promise<ModelValidationResult> {
    return this.post<ModelValidationResult>('/api/orcaflex/validate', { model });
  }

  /**
   * Make a POST request using either the external API service or HttpClient
   */
  private async post<T>(url: string, body: any): Promise<T> {
    if (this.externalApiService) {
      const response = await this.externalApiService.post(url, body);
      return response as T;
    }
    // Use Angular HttpClient for standalone mode
    return firstValueFrom(this.httpClient.post<T>(url, body));
  }
}
