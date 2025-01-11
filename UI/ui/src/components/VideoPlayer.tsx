import { useEffect, useRef } from "react";

function VideoPlayer({ FileName }: { FileName: string }){
    const videoRef = useRef(null);

    useEffect(() => {
        if(videoRef.current){
            if (!FileName) {
                console.error("Invalid FileName");
            }
            console.log("VideoPlayer: ", FileName)
        }
    },[FileName])
    
    return (
        <>
            <video ref={videoRef} width='320' height='240' controls autoPlay>
                <source src={`http://localhost:5000/video/${encodeURIComponent(FileName)}`} type='video/mp4'></source>
                Your browser does not support the video tag.
            </video>
        </>
    );
}

export default VideoPlayer;