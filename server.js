const express = require("express");
const fs = require("fs");
const path = require('path');
const srt2vtt = require('srt-to-vtt')
const ass2vtt = require('ass-to-vtt')

// set the view engine to ejs
const app = express();
app.set('view engine', 'ejs');

function encodeAllSRTFiles() {
    const directoryPath = 'assets/'
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (filename) {
            try {
                const { name, ext } = path.parse(filename);

                if (ext === '.ass') {
                    fs.createReadStream('assets/' + filename)
                        .pipe(ass2vtt())
                        .pipe(fs.createWriteStream('assets/' + name + '.vtt'))
                    console.log(`Written ${'assets/' + name}.vtt!`)
                } else if (ext === '.srt') {
                    fs.createReadStream('assets/' + filename)
                        .pipe(srt2vtt())
                        .pipe(fs.createWriteStream('assets/' + name + '.vtt'))
                    console.log(`Written ${'assets/' + name}.vtt!`)
                } else {
                    console.log('File:', filename)
                }
            } catch (e) {
                console.error(e)
            }
        });
    });
}

encodeAllSRTFiles()

function getSafeVideoname(req) {
    return req.params.videoname;
}

app.get("/:videoname", function (req, res) {
    res.render(__dirname + "/index", {
        videoname: getSafeVideoname(req)
    });
});

app.get("/captions/:videoname", function (req, res) {
    const videoname = getSafeVideoname(req);
    res.sendFile(__dirname + "/assets/" + videoname + ".vtt")
});

app.get("/video/:videoname", function (req, res) {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    const filename = getSafeVideoname(req) || "qianqiuep4"
    // get video stats (about 61MB)
    const videoPath = "assets/" + filename + ".mp4";
    const videoSize = fs.statSync(videoPath).size;

    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // Create headers
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
});


app.listen(3000, function () {
    console.log("Listening on port 3000!");
});