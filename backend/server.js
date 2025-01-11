const express = require('express');
const fileUpload = require('express-fileupload');
const { exec, ChildProcess, spawn } = require('child_process');
const fs = require('fs');
const path = require('path'); // Import path to handle file paths
const cors = require('cors'); // Import the cors package
const WebSocket = require('ws'); // Import WebSocket package


const app = express();
app.use(cors()); // Enable CORS for all routes

const { Server } = require("socket.io");
const { createServer } = require("http");
const httpServer = createServer(app);
const io = new Server(httpServer, { 
    cors: {
        origin: "http://127.0.0.1:3000",
        // or with an array of origins
        // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
        credentials: true
      } });

// setting file size
app.use(fileUpload({
    limits: { fileSize: 2000 * 1024 * 1024}, // 2GB
    useTempFiles : 'true',
    createParentPath : 'true',
    defCharset: 'utf8',
    defParamCharset: 'utf8',
}))


io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id)
  });


app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);


app.post('/video/cutSilence/click', (req, res, _next) => {
    if (!req.files || !req.files.Video) {
        return res.status(400).send('No video file was uploaded.');
    }

    const videoFile = req.files.Video;
    const uploadPath = __dirname + '/videoStorage/' + videoFile.name;

    console.log('Start receiving Video file!');
    videoFile.mv(uploadPath, function(err) {
        if (err) {
            return res.status(500).send(err);
        }

        const outputDir = path.join(__dirname, 'videoStorage', 'cut');
        const outputFilePath = path.join(outputDir, 'cut_' + videoFile.name);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const ffmpegCommand = `ffmpeg -y -i "${uploadPath}" -hide_banner -af silencedetect=n=-50dB:d=1 -f null - 2>&1 | python3 remsi.py > COMMANDFILENAME`;
        const ffmpegProcess = spawn(ffmpegCommand, {shell: true});

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`FFmpeg output: ${data}`);
            io.emit('data', data.toString());
        });

        ffmpegProcess.stderr.on('data', (data) => {
            io.emit('data', data.toString());
        });

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                io.emit('error', 'Error processing video');
                return;
            }

            fs.readFile('COMMANDFILENAME', 'utf8', (err, command) => {
                if (err) {
                    io.emit('error', 'Error reading command file');
                    return;
                }

                const child = spawn(command, { shell: true });

                child.stdout.on('data', (data) => {
                    io.emit('data', data.toString());
                    console.log('data', data.toString());
                });

                child.stderr.on('data', (data) => {
                    io.emit('data', data.toString());
                    console.log('data', data.toString());
                });

                child.on('close', (code) => {
                    console.log(`Child process exited with code ${code}`);
                    fs.unlink(uploadPath, (err) => {
                        if (err) {
                            io.emit('error', 'Error deleting original file');
                            return;
                        }
                        io.emit('FilePath', outputFilePath);
                        res.status(200).send({ response: 'ok' });
                        console.log("end response");

                    });
                });
            });
        
            
        });
    });

});

app.get('/video/:name', (req, res) => {
    console.log(`into Streamvideo: ${req.params.name}`)
    const fileName = decodeURIComponent(req.params.name);  // Decode the URL-encoded filename

    if(!fileName){
        return res.status(404).send("File Not find!");
    }
    const filePath = path.join( '/videoStorage', 'cut', fileName);
    console.log("Server Backend:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found");
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if(range){
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, {start, end});
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        };
        res.writeHead(206, head);
        file.pipe(res);
    }
    else{
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res)
    }

});

httpServer.listen(5000, () => {
    console.log('Server is running on port 5000');
});