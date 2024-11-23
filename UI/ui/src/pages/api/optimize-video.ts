import nc from 'next-connect';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter, expressWrapper } from "next-connect";

const handler = createRouter<NextApiRequest, NextApiResponse>();


handler.post(async (req, res) => {
    const { videoPath }: { videoPath: string } = req.body; // Video path from the request

    const outputDir = path.resolve('public/optimized-videos');
    if (!fs.existsSync(outputDir)) {
        console.log("Start create outputDirectory")
        fs.mkdirSync(outputDir);
    }

    const outputVideoPath = `${outputDir}/optimized-video.mp4`;

    ffmpeg(videoPath)
        .output(outputVideoPath)
        .videoCodec('libx264') // Specify codec
        .size('1280x720') // Resize to 720p
        .outputOptions('-crf 28') // Set compression rate (lower is better quality)
        .on('end', () => {
            console.log('Optimization complete');
            res.status(200).json({ message: 'Video optimized successfully!', videoUrl: '/optimized-videos/optimized-video.mp4' });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: 'Error optimizing video' });
        })
        .run();
});



export default handler.handler({
    onError: (err: any, req, res) => {
      console.error(err.stack);
      res.status(err.statusCode || 500).end(err.message);
    },
  });
