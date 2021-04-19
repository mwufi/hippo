import express from 'express'
import * as fs from 'fs';
import * as path from 'path'
import srt2vtt from 'srt-to-vtt'
import ass2vtt from 'ass-to-vtt'
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

const app = express();

Sentry.init({
    dsn: "https://e44c1c573df2421b9ecf3cd073f7a10e@o574223.ingest.sentry.io/5725145",
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


// set the view engine to ejs
app.set('view engine', 'ejs');

let __dirname = process.cwd();
let allFiles = [];

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
                    if (ext === '.mp4') {
                        allFiles.push(name)
                    }
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

app.get("/", function (req, res) {
    res.render(__dirname + "/home", {
        videos: allFiles
    });
});

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

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


// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());


app.listen(3000, function () {
    console.log("Listening on port 3000!");
});