const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const cors = require('cors');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ----Functions----
const upLoadVideoAudio = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const chunk = req.file.buffer;
  const chunkNumber = Number(req.body.chunkNumber);
  const totalChunks = Number(req.body.totalChunks);
  const fileName = req.body.originalFileName;
  const tempDir = path.join(__dirname, 'temp');

  try {
    // make sure temp directory exists
    await fs.promises.mkdir(tempDir, { recursive: true });
    const chunkFilePath = path.join(tempDir, `${fileName}_${chunkNumber}`);

    console.log("Writing chunk to temp directory", chunkFilePath);
    // write the chunk to the temp directory
    await fs.promises.writeFile(chunkFilePath, chunk);
    console.log(`Chunk ${chunkNumber} written to ${chunkFilePath}`);
    return res.status(200).json({ message: "Chunk written successfully" });
  } catch (err) {
    console.error("Error in upLoadVideoAudio:", err);
    return res.status(500).json({ message: "Failed to process file chunk" });
  }
}

// ----Routes----
// accept cut silences
app.post('/api/uploadFile', upload.single('file'), (req, res) => {
  // upload the file to the temp directory
  const result = upLoadVideoAudio(req, res);
  // cut the silences
  // const cutResult = cutSilences(req, res);
  console.log(result);
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
})
