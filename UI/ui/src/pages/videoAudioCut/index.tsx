import React, { use, useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { read } from 'fs';
import { Socket } from 'socket.io-client';
import { json } from 'stream/consumers';
const { io } = require("socket.io-client");
import VideoPlayer from '@/components/VideoPlayer';


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
    const [cutSilenceButton, setCutSilenceButton] = useState<boolean>(false); // Track cut silence button visibility
    const [ffmpegOutput, setFfmpegOutput] = useState<string>(''); // Track FFmpeg output
    const [uploadInfo, setuploadInfo] = useState('');
    const [fetching, setFetching] = useState(false);
    const [selectedFile, setFiles] = useState<File | undefined>(undefined);
    const [allowUpload, setAllowUpload] = useState(true);
    const [ProcessInfo, setProcessInfo] = useState("");
    const [FileName, setFileName] = useState("");
    

    // async function loadFFmpeg() {
    //     if (!ffmpegRef.current) {
    //         ffmpegRef.current = new FFmpeg();
    //     }
    //     try {
    //         const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    //         const ffmpeg = ffmpegRef.current;
    //         if (!ffmpeg) {
    //             throw new Error("FFmpeg instance is not available");
    //         }
    //         ffmpeg.on('log', ({ message }) => {
    //             setDebugInfo(message);
    //             console.log(message);
    //         });
    //         // toBlobURL is used to bypass CORS issue, urls with the same
    //         // domain can be used directly.
    //         await ffmpeg.load({
    //             coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    //             wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    //         });
    //         setDebugInfo("Load FFmpeg success");
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }
    const handleCutSilence = () => {
        if (video) {
            transferFileToBackend(video);
        }
    };


    // const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    //     event.preventDefault();
    //     if (!video) return;
        
    //     const data = new FormData();
    //     data.append("file", video);
    //     //TODO : Need to change url
    //     let url = "http://localhost:5000/video/cutSilence/click"; 
    //     const eventSource = new EventSource("http://localhost:5000/video/cutSilence/process");
    //     let guidValue = null;
    
    //     eventSource.addEventListener("GUI_ID", (event) => {
    //       guidValue = JSON.parse(event.data);
    //       console.log(`Guid from server: ${guidValue}`);
    //       data.append("guid", guidValue);
    //       eventSource.addEventListener(guidValue, (event) => {
    //         const result = JSON.parse(event.data);
    //         if (uploadInfo !== result) {
    //           setuploadInfo(result);
    //         }
    //         if (result === "100") {
    //           eventSource.close();
    //         }
    //       });
    //       uploadToServer(url, data);
    //     });
    
    //     eventSource.onerror = (event) => {
    //       if ((event.target as EventSource).readyState === EventSource.CLOSED) {
    //         console.log("SSE closed (" + (event.target as EventSource).readyState + ")");
    //       }
    //       setuploadInfo('0');
    //       eventSource.close();
    //     };
    
    //     eventSource.onopen = () => {
    //       console.log("connection opened");
    //     };
    //   };

    //   const uploadToServer = (url: string, data: FormData) => {
    //     setFetching(true);
    //     console.log("Upload File");
    //     let currentFile = selectedFile;
    //     console.log(currentFile);
    
    //     const requestOptions = {
    //       method: "POST",
    //       mode: "no-cors" as RequestMode,
    //       body: data,
    //     };
    //     fetch(url, requestOptions).then(() => setAllowUpload(true));
    //   };

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setDebugInfo(`Uploading file: ${file.name}`);
            const reader = new FileReader();
            reader.onload = () => {
                setUploadProgress(100); // Set progress to 100% when upload is complete
                setDebugInfo(`Upload complete: ${file.name}`); // Debug info
                // remember filename
                // setFileName(file.name);
                // transfer video data to websocket

            };
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(percentComplete); // Update progress
                    setDebugInfo(`Upload progress: ${Math.round(percentComplete)}%`); // Debug info
                }
            };
            reader.readAsArrayBuffer(file);
            // show cut silence button
            setCutSilenceButton(true);
            // transferFileToBackend(file);
            setVideo(file);
            setAllowUpload(false);
            setFiles(file);
        }
    };

    const transferFileToBackend = async (file: File) => {
        try {
            if (file) {
                const formdata = new FormData();
                formdata.append('Video', file);
                await fetch('http://localhost:5000/video/cutSilence/click', {
                    method: 'POST',
                    body: formdata,
                })
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const socket = io('http://localhost:5000');
        socket.on("connect", () => {
            console.log(socket.id);
        });

        socket.on("data", (msg: string) => {
            console.log(msg);
            setProcessInfo(msg)
        });

        socket.on("FilePath", (path: string) => {
            console.log(path);
            const filename = path.replace(/\\/g, '/').split('/');
            console.log("filename: ", filename)
            setFileName(filename[filename.length -1]);
            console.log("FileName: ", FileName);
        })
    }, [])



    return (
        <div>
            <input type="file" name='video' accept="video/*" onChange={handleVideoUpload} />
            <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px', marginTop: '10px' }}>
                <div style={{ width: `${uploadProgress}%`, backgroundColor: '#76c7c0', height: '20px', borderRadius: '5px' }} />
            </div>
            <p>{debugInfo}</p>
            <pre>{ffmpegOutput}</pre>
            {cutSilenceButton && (
                <button onClick={handleCutSilence} 
                    disabled={allowUpload}>
                    {Status === "cutSilence" ? "Converting" : "Cut Silence"}
                </button>
            )}
            {FileName !== "" && <VideoPlayer FileName={FileName} />}

            <div>{ProcessInfo}</div>
        </div>
    );
}
