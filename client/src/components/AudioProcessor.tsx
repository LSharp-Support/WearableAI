'use client'; // Required for hooks like useState, useEffect

import React, { useState, useRef, useEffect } from 'react';

const AudioProcessor: React.FC = () => {
    // State variables will go here (e.g., for recording status, transcription, etc.)
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [advice, setAdvice] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false); // New state for mount status

    // Refs for MediaRecorder and audio chunks
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Effect to set isMounted to true only on the client after initial render
    useEffect(() => {
        setIsMounted(true);
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to speak the advice when it changes
    useEffect(() => {
        if (isMounted && advice && typeof window !== 'undefined' && window.speechSynthesis) {
            // Cancel any previous speech first
            window.speechSynthesis.cancel(); 
            
            const utterance = new SpeechSynthesisUtterance(advice);
            // Optional: Configure voice, rate, pitch if needed
            // utterance.voice = window.speechSynthesis.getVoices()[0]; // Example: Select a voice
            // utterance.rate = 1; // Speed
            // utterance.pitch = 1; // Pitch
            
            window.speechSynthesis.speak(utterance);
        }

        // Optional: Cleanup function to cancel speech if component unmounts while speaking
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [advice, isMounted]); // Re-run effect when advice or isMounted changes

    const handleStartRecording = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream); // Consider specifying mimeType if needed

                // Clear previous chunks
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Default type, adjust if needed
                    setAudioBlob(audioBlob);
                    console.log("Recording stopped, Blob created:", audioBlob);
                    // Automatically send to server after stopping
                    sendAudioToServer(audioBlob);
                    // Clean up the stream tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
                setError('');
                setTranscription(''); // Clear previous results
                setAdvice('');
            } catch (err) {
                console.error("Error accessing microphone:", err);
                setError('Could not access microphone. Please ensure permission is granted.');
                setIsRecording(false);
            }
        } else {
            setError('Audio recording is not supported by this browser.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Note: The actual Blob creation and sending happens in the 'onstop' event handler
        } else {
            console.warn("Stop recording called but no active recorder found or not recording.");
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("File selected:", file.name, file.type);
            setAudioBlob(file);
            setError('');
            setTranscription(''); // Clear previous results
            setAdvice('');
            sendAudioToServer(file); // Send the uploaded file directly
        }
        // Clear the input value so the same file can be selected again if needed
        event.target.value = '';
    };

    // Function to send audio data to the backend
    const sendAudioToServer = async (audioData: Blob | File) => {
        if (!audioData) {
            setError('No audio data to send.');
            return;
        }

        setIsLoading(true);
        setError('');
        setTranscription('');
        setAdvice('');

        const formData = new FormData();
        // Provide a filename - essential for backend processing
        const fileName = audioData instanceof File ? audioData.name : `recording-${Date.now()}.webm`; 
        formData.append('audio_file', audioData, fileName);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'; // Use env var or default

        try {
            console.log(`Sending audio data (${fileName}) to ${backendUrl}/process_audio`);
            const response = await fetch(`${backendUrl}/process_audio`, {
                method: 'POST',
                body: formData,
                // Do NOT set Content-Type header manually when using FormData with fetch,
                // the browser sets it correctly with the boundary.
            });

            if (!response.ok) {
                 // Try to get error detail from backend response
                let errorDetail = 'Failed to process audio.';
                try {
                    const errorJson = await response.json();
                    errorDetail = errorJson.detail || errorDetail;
                } catch (e) {
                    // Ignore if response is not JSON or empty
                }
                throw new Error(`${response.status} ${response.statusText}: ${errorDetail}`);
            }

            const result = await response.json();
            console.log('Received response:', result);
            setTranscription(result.transcription || 'No transcription available.');
            setAdvice(result.advice || 'No advice generated.');

        } catch (err: any) {
            console.error('Error sending audio to server:', err);
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render null or a placeholder until the component has mounted on the client
    if (!isMounted) {
        // Returning null is simplest, or you can return a basic loading skeleton
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                 <h1 className="text-3xl font-bold mb-6">Wearable AI Assistant (PoC)</h1>
                 <p>Loading Interface...</p> {/* Basic placeholder */}
            </div>
        );
    }

    // Original return statement, now only rendered after mount
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-6">Wearable AI Assistant (PoC)</h1>

            {/* Controls */} 
            <div className="mb-6 space-x-4">
                <button
                    onClick={handleStartRecording}
                    disabled={isRecording || isLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 transition-colors"
                >
                    Start Recording
                </button>
                <button
                    onClick={handleStopRecording}
                    disabled={!isRecording || isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 transition-colors"
                >
                    Stop Recording
                </button>
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition-colors">
                    Upload Audio File
                    <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleFileUpload}
                        disabled={isLoading} 
                        className="hidden" // Hide the default input appearance
                    />
                </label>
            </div>

            {/* Status Indicator */} 
            {isLoading && <p className="text-yellow-400 mb-4">Processing...</p>}
            {error && <p className="text-red-500 mb-4">Error: {error}</p>}
            {isRecording && <p className="text-blue-400 mb-4 animate-pulse">🔴 Recording...</p>}

            {/* Results Display */} 
            <div className="w-full max-w-2xl bg-gray-800 p-4 rounded shadow-md mb-4">
                <h2 className="text-xl font-semibold mb-2">Transcription:</h2>
                <p className="text-gray-300 whitespace-pre-wrap min-h-[50px]">
                    {transcription || '...'}
                </p>
            </div>

            <div className="w-full max-w-2xl bg-gray-700 p-4 rounded shadow-md">
                 <h2 className="text-xl font-semibold mb-2">AI Assistant Advice:</h2>
                <p className="text-gray-200 whitespace-pre-wrap min-h-[50px]">
                    {advice || '...'}
                </p>
            </div>

        </div>
    );
};

export default AudioProcessor;
