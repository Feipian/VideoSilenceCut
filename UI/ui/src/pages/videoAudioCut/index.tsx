import Link from 'next/link';
import styles from './index.module.scss'
import React, { ChangeEvent, useState } from 'react';
import axios, { ResponseType } from 'axios';


export default function VideoAudioCut() {
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (file) {
      setSelectedFile(file);
      console.log(file)
    }
  }

  const handleFileUpload = () => {
      if(!selectedFile){
        alert("No file selected")
        return
        }
      
      const chunkSize = 1024 * 1024 * 10; // 10MB
      const chunks = Math.ceil(selectedFile.size / chunkSize);  
      const chunkProgress = 100 / chunks;
      // record this chunk id
      let chunckNumber = 0;
      let start = 0;
      let end = 0;

      const uploadNextChunk = () => {
        if(end < selectedFile.size){
          // split the file into chunks
          const chunk = selectedFile.slice(start, end)
          const formData = new FormData()
          formData.append('file', chunk)
          formData.append('totalChunks', chunks.toString())
          formData.append('chunkNumber', chunckNumber.toString())
          formData.append('originalFileName', selectedFile.name)
      
          // upload the chunk
          fetch('http://localhost:8000/api/uploadFile', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            console.log(data)
            const temp = `Chunk ${
              chunckNumber+1
            }/${chunks} uploaded successfully`;

            setStatus(temp)
            setProgress(chunkProgress * (chunckNumber+1));
            console.log(temp)
            chunckNumber++;
            start = end;
            end = start + chunkSize;
            uploadNextChunk();
          })
          .catch(error => {
            console.error('Error uploading chunk:', error);
          });
        } else {
          setProgress(100);
          setSelectedFile(null);
          console.log("All chunks uploaded successfully");
        }
    };
    // 
    uploadNextChunk();
  }
  

  return (
    <div>
      <h2>Resumable File Upload</h2>
      <h3>{status}</h3>
      {/* {progress > 0 && <Progress value={progress} />} // TODO: Add progress bar */}
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>
    </div>
  );
}
