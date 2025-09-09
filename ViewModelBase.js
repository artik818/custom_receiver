export class ViewModelBase {
    constructor({repo}) {
        this.rtcPeerConnection = repo.getRtcConnection();
        this.repo = repo;
        this.baseValue = 1000/29.97;
        this.videoStream = null;
        this.uiStateReceiver = null;
        this.htmlMediaElement = null;
        this.startTime = 0;
        this.playerNowTimestamp = 0;
        this.frameDeltas = [];
        this.framesSqSum = 0;
        this.framesSqSumCount = 0;
        this.frameTimestamps = [];
        this.fpsWindowSize = 120;
        this.viewState = { createPlayer: false, 
            closeapp : false, 
            fps: 0.0,
            totalFramesPlayer: 0,
            droppedFramesPlayer: 0,
            videoCodecStr: ""
        };
        this.rtcPeerConnection.init({
            onGotVideoStreamFnc: this.onGotVideoStreamFnc.bind(this),
            clogObject: repo.getLog()
        });        
        this.monitorState = { 
            "width": 0, 
            "height": 0, 
            "playing": false, 
            "currentTime": 0, 
            "fps": 0.0,
            "totalFramesPlayer": 0,
            "droppedFramesPlayer": 0,
            "videoCodecStr": "",
        }
    }

    onGotVideoStreamFnc(kind, stream) {
        this.viewState.createPlayer = true;
        this.viewState.playerType = kind;
        this.viewState.stream = stream;
        this.uiStateReceiver(this.viewState);
    }

    clog(message) {
        if (this.repo.getLog()) {
            this.repo.getLog().add(message);
        } else {
            console.log(message);
        }
        this.repo.getBackend().sendLog(message)
            .catch(err => {
                console.error("Error sending log to backend:", err);
            });
    }

    setStateReceiver(uiStateReceiver) {
        this.uiStateReceiver = uiStateReceiver;
        this.uiStateReceiver(this.viewState);
    }

    onLoadFinished() {
        this.clog('Starting session')
        const backend = this.repo.getBackend();
        const rtcConnection = this.repo.getRtcConnection();
        backend.setOnLostSender(() => {
            this.clog("Lost connection to sender, stopping app.");
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            this.viewState.closeapp = true;
            this.uiStateReceiver(this.viewState);
        });
        backend.start()
        backend.getOffer()
            .then(offer => {
                return rtcConnection.handleOffer(offer)
            })
            .then(() => backend.sendAnswer(rtcConnection.getLocalDescription()))
            .catch(err => {
                this.clog("onLoadFinished error: " + err + "\n" + (err && err.stack ? err.stack : ""));
            });
    }

    onPlayerCurrentTime(currentTime, totalFrames, dropFrames) {
        this.rtcPeerConnection.getStats(null)
            .then((stats) => {
                this.viewState.transportStr = "";
                // let statsOutput = "";

                stats.forEach((report) => {
                    if (report.type === "codec") {
                        this.viewState.videoCodecStr = report.mimeType + " " + report.payloadType + " " + report.clockRate;
                        this.monitorState["videoCodecStr"] = this.viewState.videoCodecStr;
                    } else if (report.type === "inbound-rtp") {
                        this.viewState.rtpStr = report.jitter.toFixed(4)  + " ms, " + report.packetsLost + " lost of " + report.packetsReceived + 
                            ", droped " + report.framesDropped + "/" + report.framesDecoded +
                            ", kfd " + report.keyFramesDecoded;
                        this.monitorState["jitter"] = report.jitter;
                        this.monitorState["droppedFramesRTP"] = report.packetsLost;
                        this.monitorState["totalFramesRTP"] = report.packetsReceived;
                    } else if (report.type === "transport") {
                        this.viewState.transportStr = "trx " + report.bytesSent + "/" + report.bytesReceived + " b";
                    }

                    // statsOutput +=
                    //     `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                    //     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

                    // // Now the statistics for this report; we intentionally drop the ones we
                    // // sorted to the top above

                    // Object.keys(report).forEach((statName) => {
                    //     if (
                    //     statName !== "id" &&
                    //     statName !== "timestamp" &&
                    //     statName !== "type"
                    //     ) {
                    //     statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                    //     }
                    // });
                });
                // this.clog("Stats: " + statsOutput);
            })
            .catch(err => {
                this.clog("Error getting stats: " + err);
            });
        this.viewState.totalFramesPlayer = totalFrames;
        this.viewState.droppedFramesPlayer = dropFrames;           
        this.monitorState["totalFramesPlayer"] = totalFrames;
        this.monitorState["droppedFramesPlayer"] = dropFrames;
        this.monitorState["currentTime"] = currentTime;
        // Throttle updateVideoStatus to prevent calling too often
        if (!this.lastVideoStatusUpdate || Date.now() - this.lastVideoStatusUpdate > 2000) {
            this.lastVideoStatusUpdate = Date.now();
            this.repo.getBackend().updateVideoStatus(this.monitorState).catch(err => {
                console.error("Error updateVideoStatus:", err);
            });
        }
    }

    onPlayerError(error) {
        this.clog("Error starting playback: " + error.message);
    }

    onPlayerResize(videoWidth, videoHeight) {
        this.clog("Resizing player to " + videoWidth + "x" + videoHeight);
        this.monitorState["width"] = videoWidth;
        this.monitorState["height"] = videoHeight;
        this.repo.getBackend().updateVideoStatus(this.monitorState).catch(err => {
            console.error("Error updateVideoStatus:", err);
        });
    }

    onPlayerFinishedPlayback() {
        this.clog("Media has ended.");
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    onPlayerStartPlaying() {
        this.clog("Media is now playing.");
        this.monitorState["playing"] = true;
        this.startTime = 0;
        this.frameTimestamps = [];
        this.frameDeltas = [];
        this.repo.getBackend().updateVideoStatus(this.monitorState).catch(err => {
            console.error("Error updateVideoStatus:", err);
        });

        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => {
                this.viewState.updateVideoStatus = true;
                this.uiStateReceiver(this.viewState);
            }, 1000); // Update every second
        }
    }

    onVideoStatusUpdated() {
        this.viewState.updateVideoStatus = false;
        if (this.frameTimestamps.length === 0) {
            this.viewState.fps = 0;
        } else {
            const elapsed = (this.playerNowTimestamp - Math.min(...this.frameTimestamps)) / 1000;
            this.viewState.fps = this.frameTimestamps.length / elapsed;
        }
        this.monitorState["fps"] = this.viewState.fps;
        this.uiStateReceiver(this.viewState);
    }

    onPlayerCreated() {
        this.viewState.createPlayer = false;
        this.viewState.playerType = null;
        this.viewState.stream = null;
        this.uiStateReceiver(this.viewState);
    }

    onAppShutdown() {
        this.clog("onAppShutdown called, closing app.");
        // web application closed, notify the backend
        this.repo.getBackend().sendAppShutdown()
    }

    onAppCloseHandled() {
        this.viewState.closeapp = false;
        this.uiStateReceiver(this.viewState);
    }

    onVideoFrame(now, metadata) {
        // now
        // 12143.9
        // metadata
        // {"expectedDisplayTime":12145.9,
        // "height":720,
        // "mediaTime":9.907,
        // "presentationTime":12129.7,
        // "presentedFrames":299,
        // "processingDuration":0.0044,
        // "receiveTime":12119,
        // "rtpTimestamp":3933430756,
        // "width":1280}

        this.monitorState["width"] = metadata.width;
        this.monitorState["height"] = metadata.height;
        const ts = metadata.presentationTime; // / 90000; // Convert RTP timestamp to milliseconds

        if (this.startTime === 0) {
            this.startTime = now;
            this.playerNowTimestamp = ts;
            return;
        }
        const delta = ts - this.playerNowTimestamp;
        this.playerNowTimestamp = ts;
        this.frameTimestamps.push(ts);
        this.frameDeltas.push(delta);

        this.framesSqSum += Math.pow(delta - this.baseValue, 2);
        this.framesSqSumCount++;

        // this.clog(`Frame delta: ${delta} ms`);
        if (this.frameTimestamps.length > this.fpsWindowSize) {
            this.frameTimestamps = this.frameTimestamps.slice(-this.fpsWindowSize);
            this.frameDeltas = this.frameDeltas.slice(-this.fpsWindowSize);
        }
    }    
}
