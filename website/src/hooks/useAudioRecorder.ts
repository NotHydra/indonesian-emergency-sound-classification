import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
    isSupported: boolean;
}

interface UseAudioRecorderOptions {
    maxDuration?: number; // Maximum recording duration in seconds
    onMaxDurationReached?: () => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
    const { maxDuration = 15, onMaxDurationReached } = options;

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState<boolean>(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check browser support on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            setIsSupported(supported);
            if (!supported) {
                setError("Audio recording is not supported in this browser");
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const startRecording = useCallback(async (): Promise<void> => {
        try {
            setError(null);
            chunksRef.current = [];

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            streamRef.current = stream;

            // Create MediaRecorder with best available format
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                  ? "audio/webm"
                  : MediaRecorder.isTypeSupported("audio/mp4")
                    ? "audio/mp4"
                    : "audio/wav";

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);

                // Create URL for audio preview
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            };

            mediaRecorder.onerror = () => {
                setError("Recording error occurred");
                setIsRecording(false);
            };

            // Start recording
            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setDuration(0);

            // Clear previous audio
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
            }
            setAudioBlob(null);

            // Start duration timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setDuration(elapsed);

                // Check max duration
                if (elapsed >= maxDuration) {
                    mediaRecorder.stop();
                    setIsRecording(false);
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    onMaxDurationReached?.();
                }
            }, 100);
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === "NotAllowedError") {
                    setError("Microphone access denied. Please allow microphone access to record audio.");
                } else if (err.name === "NotFoundError") {
                    setError("No microphone found. Please connect a microphone.");
                } else {
                    setError(`Failed to start recording: ${err.message}`);
                }
            } else {
                setError("Failed to start recording");
            }
            setIsRecording(false);
        }
    }, [maxDuration, onMaxDurationReached, audioUrl]);

    const stopRecording = useCallback((): void => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const resetRecording = useCallback((): void => {
        stopRecording();
        setDuration(0);
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        setError(null);
        chunksRef.current = [];
    }, [stopRecording, audioUrl]);

    return {
        isRecording,
        isPaused,
        duration,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        resetRecording,
        isSupported,
    };
}
