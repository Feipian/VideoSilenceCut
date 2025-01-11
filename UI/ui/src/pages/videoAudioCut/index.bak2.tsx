import React, { useState, ChangeEvent, FormEvent } from 'react';

export default function OptimizeVideo() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');
    const [videoUrl, setVideoUrl] = useState<string>('');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!file) {
            return alert('Please upload a video file.');
        }

        const formData = new FormData();
        formData.append('video', file);

        const res = await fetch('/api/optimize-video', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (res.ok) {
            setMessage(data.message);
            setVideoUrl(data.videoURL);
        } else {
            setMessage('Error optimizing video.');
        }
    };

    return (
        <div>
            <h1>Optimize Video with FFmpeg</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" accept="video/*" onChange={handleFileChange} />
                <button type="submit">Upload and Optimize</button>
            </form>
            {message && <p>{message}</p>}
            {videoUrl && <video src={videoUrl} controls width="600" />}
        </div>
    );
}
