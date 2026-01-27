interface Response<DataType = null> {
    success: boolean;
    status: number;
    message: string;
    data: DataType;
}

interface ClassificationResult {
    isAmbulance: boolean;
    confidence: number;
    confidencePercent: string;
}
