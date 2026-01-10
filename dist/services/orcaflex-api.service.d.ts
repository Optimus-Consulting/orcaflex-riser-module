import { CatenaryRequest, CatenaryResult, LazyWaveRequest, LazyWaveResult, ParseYamlResponse, GenerateYamlRequest, ModelValidationResult, VesselExtractResponse } from '../types';
/**
 * API service for OrcaFlex calculations and YAML operations.
 * Uses the ModuleApiService provided by CARIS host application,
 * or falls back to HttpClient for standalone testing.
 */
export declare class OrcaFlexApiService {
    private httpClient;
    private externalApiService;
    /**
     * Initialize with the CARIS module API service (optional)
     */
    setApiService(api: any): void;
    calculateCatenary(request: CatenaryRequest): Promise<CatenaryResult>;
    calculateLazyWave(request: LazyWaveRequest): Promise<LazyWaveResult>;
    parseYaml(content: string): Promise<ParseYamlResponse>;
    parseVesselFromYaml(content: string | File): Promise<VesselExtractResponse>;
    generateYaml(request: GenerateYamlRequest): Promise<{
        yaml: string;
    }>;
    downloadYaml(request: GenerateYamlRequest): Promise<Blob>;
    validateModel(model: any): Promise<ModelValidationResult>;
    /**
     * Make a POST request using either the external API service or HttpClient
     */
    private post;
}
//# sourceMappingURL=orcaflex-api.service.d.ts.map