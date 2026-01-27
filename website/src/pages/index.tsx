"use client";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import axios from "axios";
import Head from "next/head";
import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";

// Types
interface ClassificationResult {
    isAmbulance: boolean;
    confidence: number;
    confidencePercent: string;
}

interface ApiResponse {
    success: boolean;
    status: number;
    message: string;
    data: ClassificationResult | null;
}

type TabType = "upload" | "record";

// Constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_RECORDING_DURATION = 15;
const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".webm", ".ogg", ".m4a"];
const ALLOWED_MIME_TYPES = [
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
];

export default function Home(): JSX.Element {
    const classificationURL: string =
        process.env.NEXT_PUBLIC_CLASSIFICATION_URL || "http://localhost:3001/api/classify";

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("upload");

    // File upload state
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Recording state
    const {
        isRecording,
        duration: recordingDuration,
        audioBlob,
        audioUrl,
        error: recordingError,
        startRecording,
        stopRecording,
        resetRecording,
        isSupported: isRecordingSupported,
    } = useAudioRecorder({
        maxDuration: MAX_RECORDING_DURATION,
        onMaxDurationReached: () => {
            // Recording automatically stops
        },
    });

    // Submission state
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Result state
    const [showResult, setShowResult] = useState<boolean>(false);
    const [result, setResult] = useState<ClassificationResult | null>(null);

    // Helpers
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getConfidenceLevel = (confidence: number): "high" | "medium" | "low" => {
        if (confidence >= 0.8) return "high";
        if (confidence >= 0.5) return "medium";
        return "low";
    };

    const validateFile = (fileToValidate: File): string | null => {
        // Check file size
        if (fileToValidate.size > MAX_FILE_SIZE_BYTES) {
            return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`;
        }

        // Check file type
        const extension = "." + fileToValidate.name.split(".").pop()?.toLowerCase();
        const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
        const isValidMimeType = ALLOWED_MIME_TYPES.includes(fileToValidate.type);

        if (!isValidExtension && !isValidMimeType) {
            return "Invalid file type. Supported formats: WAV, MP3, WebM, OGG, M4A";
        }

        return null;
    };

    const truncateFileName = (name: string, maxLength: number = 40): string => {
        if (name.length <= maxLength) return name;
        const extension = name.split(".").pop() || "";
        const nameWithoutExt = name.slice(0, name.lastIndexOf("."));
        const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4);
        return `${truncatedName}...${extension}`;
    };

    // File handlers
    const handleFileSelect = useCallback((selectedFile: File) => {
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }

        setFile(selectedFile);
        setFileName(truncateFileName(selectedFile.name));
        setError(null);
    }, []);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setIsDragOver(false);

        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleUploadZoneClick = (): void => {
        fileInputRef.current?.click();
    };

    const clearFile = (): void => {
        setFile(null);
        setFileName("");
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Recording handlers
    const handleStartRecording = async (): Promise<void> => {
        setError(null);
        await startRecording();
    };

    const handleStopRecording = (): void => {
        stopRecording();
    };

    const handleResetRecording = (): void => {
        resetRecording();
        setError(null);
    };

    // Submit handler
    const handleSubmit = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            let audioData: Blob | File | null = null;
            let audioFileName = "audio.wav";

            if (activeTab === "upload") {
                if (!file) {
                    setError("Please select a file to analyze");
                    setIsLoading(false);
                    return;
                }
                audioData = file;
                audioFileName = file.name;
            } else {
                if (!audioBlob) {
                    setError("Please record audio first");
                    setIsLoading(false);
                    return;
                }
                audioData = audioBlob;
                audioFileName = "recording.webm";
            }

            const formData = new FormData();
            formData.append("file", audioData, audioFileName);

            const response = await axios.post<ApiResponse>(classificationURL, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success && response.data.data) {
                setResult(response.data.data);
                setShowResult(true);
            } else {
                setError(response.data.message || "Classification failed");
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message || "Failed to analyze audio. Please try again.";
                setError(message);
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Modal handlers
    const handleCloseResult = (): void => {
        setShowResult(false);
        setResult(null);
    };

    // Check if submit is enabled
    const canSubmit =
        !isLoading &&
        ((activeTab === "upload" && file !== null) || (activeTab === "record" && audioBlob !== null));

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta
                    name="description"
                    content="Classify emergency sounds using AI. Upload or record audio to detect ambulance sirens."
                />
                <title>Indonesian Emergency Sound Classification</title>
            </Head>

            <section className="hero home is-fullheight">
                <div className="hero-body">
                    <div className="container">
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <h1 className="main-title">
                                <i className="fas fa-ambulance" style={{ marginRight: "0.75rem" }}></i>
                                Indonesian Emergency Sound Classification
                            </h1>
                            <p className="main-subtitle">Upload or record audio to detect emergency sounds</p>
                        </div>

                        <div className="main-card">
                            {/* Tab Navigation */}
                            <div className="tab-navigation">
                                <button
                                    className={`tab-button ${activeTab === "upload" ? "active" : ""}`}
                                    onClick={() => setActiveTab("upload")}
                                >
                                    <i className="fas fa-file-audio"></i>
                                    <span>Upload File</span>
                                </button>
                                <button
                                    className={`tab-button ${activeTab === "record" ? "active" : ""}`}
                                    onClick={() => setActiveTab("record")}
                                    disabled={!isRecordingSupported}
                                >
                                    <i className="fas fa-microphone"></i>
                                    <span>Record Audio</span>
                                </button>
                            </div>

                            {/* Error Message */}
                            {(error || recordingError) && (
                                <div className="error-message">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span>{error || recordingError}</span>
                                </div>
                            )}

                            {/* Upload Tab */}
                            {activeTab === "upload" && (
                                <div>
                                    <div
                                        className={`upload-zone ${file ? "has-file" : ""} ${isDragOver ? "drag-over" : ""}`}
                                        onClick={handleUploadZoneClick}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".wav,.mp3,.webm,.ogg,.m4a,audio/*"
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                        />

                                        <div className="upload-icon">
                                            <i className={`fas ${file ? "fa-file-audio" : "fa-cloud-upload-alt"}`}></i>
                                        </div>

                                        {file ? (
                                            <>
                                                <p className="upload-text">File selected</p>
                                                <div className="file-name-display">{fileName}</div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="upload-text">Drop your audio file here or click to browse</p>
                                                <p className="upload-hint">Supports WAV, MP3, WebM, OGG, M4A (max {MAX_FILE_SIZE_MB}MB)</p>
                                            </>
                                        )}
                                    </div>

                                    {file && (
                                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                            <button className="btn-secondary" onClick={clearFile} style={{ flex: 1 }}>
                                                <i className="fas fa-times"></i>
                                                <span>Clear</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Record Tab */}
                            {activeTab === "record" && (
                                <div className="recording-section">
                                    {!isRecordingSupported ? (
                                        <div className="error-message">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <span>Audio recording is not supported in this browser</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="recording-indicator">
                                                <div className={`recording-circle ${isRecording ? "is-recording" : ""}`}>
                                                    <i
                                                        className={`fas fa-microphone recording-icon ${isRecording ? "is-recording" : ""}`}
                                                    ></i>
                                                </div>

                                                <div>
                                                    <div className="recording-timer">
                                                        {formatDuration(recordingDuration)} / {formatDuration(MAX_RECORDING_DURATION)}
                                                    </div>
                                                    <div className="recording-timer-label">
                                                        {isRecording
                                                            ? "Recording..."
                                                            : audioBlob
                                                              ? "Recording complete"
                                                              : "Ready to record"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="recording-controls">
                                                {!isRecording && !audioBlob && (
                                                    <button className="btn-danger" onClick={handleStartRecording}>
                                                        <i className="fas fa-circle"></i>
                                                        <span>Start Recording</span>
                                                    </button>
                                                )}

                                                {isRecording && (
                                                    <button className="btn-secondary" onClick={handleStopRecording}>
                                                        <i className="fas fa-stop"></i>
                                                        <span>Stop Recording</span>
                                                    </button>
                                                )}

                                                {audioBlob && !isRecording && (
                                                    <button className="btn-secondary" onClick={handleResetRecording}>
                                                        <i className="fas fa-redo"></i>
                                                        <span>Record Again</span>
                                                    </button>
                                                )}
                                            </div>

                                            {audioUrl && !isRecording && (
                                                <div className="audio-preview">
                                                    <div className="audio-preview-label">
                                                        <i className="fas fa-play-circle"></i>
                                                        <span>Preview Recording</span>
                                                    </div>
                                                    <audio controls src={audioUrl} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-search"></i>
                                        <span>Analyze Sound</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Result Modal */}
            <div className={`result-modal ${showResult ? "is-active" : ""}`}>
                <div className="result-modal-backdrop" onClick={handleCloseResult}></div>
                <div className="result-modal-content">
                    {result && (
                        <>
                            <div className={`result-icon ${result.isAmbulance ? "success" : "danger"}`}>
                                <i className={`fas ${result.isAmbulance ? "fa-ambulance" : "fa-volume-mute"}`}></i>
                            </div>

                            <h2 className="result-title">
                                {result.isAmbulance ? "Ambulance Siren Detected!" : "No Ambulance Siren"}
                            </h2>

                            <p className="result-message">
                                {result.isAmbulance
                                    ? "The audio contains an emergency ambulance siren."
                                    : "No emergency ambulance siren was detected in the audio."}
                            </p>

                            <div className="confidence-meter">
                                <div className="confidence-label">Confidence Level</div>
                                <div className="confidence-bar-container">
                                    <div
                                        className={`confidence-bar ${getConfidenceLevel(result.confidence)}`}
                                        style={{ width: `${result.confidence * 100}%` }}
                                    ></div>
                                </div>
                                <div className={`confidence-value ${getConfidenceLevel(result.confidence)}`}>
                                    {result.confidencePercent}
                                </div>
                            </div>

                            <button className="btn-secondary" onClick={handleCloseResult} style={{ width: "100%" }}>
                                <i className="fas fa-times"></i>
                                <span>Close</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <div className="content has-text-centered">
                    <div className="is-size-3 mb-2">
                        <a
                            className="footer-link"
                            href="https://github.com/NotHydra/indonesian-emergency-sound-classification"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i className="fa-brands fa-github"></i>
                        </a>
                    </div>

                    <p>
                        <strong>
                            Copyright &copy; {new Date().getFullYear()} -{" "}
                            <a className="footer-link" href="https://itk.ac.id" target="_blank" rel="noopener noreferrer">
                                ITK
                            </a>{" "}
                            -{" "}
                            <a className="footer-link" href="https://if.itk.ac.id" target="_blank" rel="noopener noreferrer">
                                IF
                            </a>{" "}
                            - Indonesian Emergency Sound Classification - All Rights Reserved
                        </strong>
                    </p>
                </div>
            </footer>
        </>
    );
}
