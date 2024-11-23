'use client'

import React, { HtmlHTMLAttributes, useEffect, useReducer, useRef, useState } from 'react';

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'





export default function VideoAudioCut() {
    // ... existing code ...



    const ffmpegRef = useRef< FFmpeg | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
    const [debugInfo, setDebugInfo] = useState<string>(''); // Track debug information
    // for store vidoe
    const [video, setVideo] = React.useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // record video process status
    const[Status, setStatus] = useState<String | null>(null);

    useEffect( () => {
        // load ffmpeg
        loadFFmpeg();
    }, [])

    async function  loadFFmpeg() {
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        //try load FFmpeg
        try{
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) {
                throw new Error("FFmpeg instance is not available");
            }
            ffmpeg.on('log', ({ message }) => {
                setDebugInfo(message);
                console.log(message);
            });
            // toBlobURL is used to bypass CORS issue, urls with the same
            // domain can be used directly.
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setDebugInfo("Load FFmpeg success")
            
            
        }catch(err){
            
        }

        
    } 

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {


            setDebugInfo(`Uploading file: ${file.name}`); // Debug info
            const reader = new FileReader();
            reader.onload = () => {
                setUploadProgress(100); // Set progress to 100% when upload is complete
                setDebugInfo(`Upload complete: ${file.name}`); // Debug info

            };
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(percentComplete); // Update progress
                    setDebugInfo(`Upload progress: ${Math.round(percentComplete)}%`); // Debug info
                }
            };
            reader.readAsArrayBuffer(file); // Start reading the file

            setVideo(file)
        }
    };

    const cutSilenceFromVideo = async () => {

        // check video
        if(!video) throw Error("No video select");
        const ffmpeg = ffmpegRef.current;
        if(!ffmpeg) throw Error("FFmpeg not load");
        console.log("Strat cut silence");

        // setting output name
        const outputFileName = "output.mp4";
        // write input file
        await ffmpeg.writeFile(video.name, await fetchFile(video));

        // execute ffmpeg command to cut silence
        await ffmpeg.exec([
            '-i', video.name, // Input file
            '-af', 'silenceremove=1:5:-30dB', // Apply silence removal filter
            outputFileName // Output file
        ]);

        // read output data
        const data = await ffmpeg.readFile(outputFileName) as Uint8Array;
        const url = URL.createObjectURL(new Blob([data.buffer],  {type: "video/mp4" }));

        setVideo(null);
        setVideoUrl(url);
        setDebugInfo("Success cut silence");

        
    };

    return (
        
        <div>
            <script>
                if (!crossOriginIsolated) SharedArrayBuffer = ArrayBuffer;
            </script>
            <input type="file" accept="video/*" onChange={handleVideoUpload}  />
            <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px', marginTop: '10px' }}>
                <div style={{ width: `${uploadProgress}%`, backgroundColor: '#76c7c0', height: '20px', borderRadius: '5px' }} />
            </div>
            <p>{debugInfo}</p> {/* Display debug information */}
            {/* ... existing code ... */}
            {video && (
                <button onClick={ () => cutSilenceFromVideo()}>
                    {Status === "cutSilence" ? "converting" : "Cut Silence"}
                </button>
            )}

            
            {videoUrl && (
                <video
                    ref={videoRef}
                    controls
                >
                    Your browsser not support this video player!
                </video>
            )}
        </div>
    );
}
