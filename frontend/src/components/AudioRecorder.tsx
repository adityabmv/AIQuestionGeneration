import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface AudioRecorderProps {
    refreshFiles: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ refreshFiles }) => {
    const [recording, setRecording] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState<string>("");
    const [extraction, setExtraction] = useState<boolean>(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const toggleRecording = async () => {
        if (!recording) {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        setAudioBlob(event.data);
                    }
                };

                mediaRecorder.start();
                mediaRecorderRef.current = mediaRecorder;
                setRecording(true);
            } catch (error) {
                alert("Error accessing microphone. Please check permissions.");
                console.error("Microphone access error:", error);
            }
        } else {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setRecording(false);
        }
    };

    const uploadRecording = () => {
        if (!audioBlob) {
            alert("No audio recorded yet.");
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `recording_${timestamp}.mp3`;
        console.log(filename);

        const formData = new FormData();
        formData.append("audio_file", audioBlob, filename);

        fetch(`${API_URL}/upload-audio`, {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (res.ok) {
                    alert("Recording uploaded successfully!");
                    refreshFiles();
                    setAudioBlob(null); // Reset after upload
                } else {
                    alert("Error uploading recording.");
                }
            })
            .catch((error) => {
                console.error("Error uploading recording:", error);
                alert("Error uploading recording.");
            });
    };

    const handleYoutubeDownload = async () => {
        if (!youtubeUrl) {
            alert("Please enter a valid YouTube URL.");
            return;
        }
        setExtraction(true);
        try {
            const response = await fetch(`${API_URL}/download-youtube-audio`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtube_url: youtubeUrl }),
            });

            if (response.ok) {
                alert("YouTube audio extracted and saved successfully!");
                refreshFiles();
                setYoutubeUrl("");
            } else {
                console.log(response);
                alert("Failed to extract audio. Please check the URL.");
            }
        } catch (error) {
            console.error("Error downloading YouTube audio:", error);
            alert("Error downloading audio.");
        } finally {
            setExtraction(false);
        }
    };

    return (
        <div className="audio-recorder container">
            <h3>Audio Recorder</h3>
            <button onClick={toggleRecording} className="record-button">
                {recording ? "Stop Recording" : "Start Recording"}
            </button>

            {audioBlob && (
                <>
                    <p>Recording ready to upload.</p>
                    <button onClick={uploadRecording}>Upload Recording</button>
                </>
            )}

          
            <h4>Extract Audio from YouTube</h4>
            <input
                type="text"
                placeholder="Enter YouTube URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <button onClick={handleYoutubeDownload} disabled={extraction}>
                {extraction ? "Extracting audio" : "Extract audio"}
            </button>
        </div>
    );
};

export default AudioRecorder;
