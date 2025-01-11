import multer from 'multer';
import admin from 'firebase-admin';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import serviceAccount from '../key/videocutsilence-firebase-adminsdk-69zkm-9e437c9d46.json' assert { type: "json" };

const videoFilter = (req, file, cb) => {
   // Accept video files only
   if (!file.originalname.match(/\.(mp4|avi|mkv)$/)) {
       return cb(new Error('Only video files are allowed!'), false);
   }
   cb(null, true);
};

const checkFileSize = async (filePath) => {

   const stats = fs.statSync(filePath);
   const fileSizeInBytes = stats.size;
   console.log(`Video file size: ${fileSizeInBytes} bytes`);
   return fileSizeInBytes;
}

const upload = multer({
   fileFilter: videoFilter,
   storage: multer.memoryStorage(),
}).single('files');

admin.initializeApp({ 
   credential: admin.credential.cert(serviceAccount),
   storageBucket: "logrocket-uploads.appspot.com"
});

export const uploadAttachment = async (req, res) => {
   try {
       upload(req, res, async function (err) {
           if (err) {
               console.error(err)
               res.status(403).send({
                   message: "Error uploading document. Make sure it is a video file."
               })
           } else {
                console.log("using uploadAttachment ")
               const inputBuffer = req.file.buffer;

               //save buffer to file
               const inputFileExtension = path.extname(req.file.originalname);
               const today = new Date();
               const dateTime = today.toLocaleString();
               const inputFile = `${dateTime}-input${inputFileExtension}`;
               console.log("Saving file to disk...", inputFile);

               fs.writeFileSync(inputFile, inputBuffer);
               console.log("File saved to disk.");

               console.log(`Checking input filesize in bytes`);
               await checkFileSize(inputFile);

               ffmpeg(inputFile)
                   .output(req.file.originalname)
                   .videoCodec("libx264")
                   .audioCodec('aac')
                   .videoBitrate(`1k`)
                   .autopad()
                   .on("end", async function () {
                       console.log("Video compression complete!");

                       const bucket = admin.storage().bucket();
                       const newFile = bucket.file(req.file.originalname);
                       await newFile.save(`./${req.file.originalname}`);

                       console.log(`Checking output filesize in bytes`);
                       await checkFileSize(`./${req.file.originalname}`);

                       fs.unlinkSync(inputFile);
                       fs.unlinkSync(req.file.originalname)
                       res.json("Files uploaded successfully.");
                   })
                   .run();
           }
       })

   } catch (error) {
       console.log(error)
       res.status(500).send({
           message: "Something went wrong while uploading..."
       })
   }
}

export const getAllAttachments = async (req, res) => {
   try {
       const bucket = admin.storage().bucket();
       const options = {
           action: 'read',
           expires: '01-01-2024'
       };
       const fileList = [];
       const [files] = await bucket.getFiles();
       for (const file of files) {
           const [url] = await file.getSignedUrl(options);
           fileList.push(url);
       }
       res.json(fileList);
   } catch (error) {
       console.log(error)
       res.status(500).send({
           message: "Something went wrong."
       })
   }
}