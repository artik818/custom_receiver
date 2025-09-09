
export class View {
    constructor(viewModel, debugMode) {
        this.videoElement = document.getElementById('video');
        this.frameNo = document.getElementById('frameNo');
        this.viewModel = viewModel;
        this.playerLive = null;
        this.playerCheckIntervalMs = 2500;
        this.debugMode = debugMode;
        viewModel.setStateReceiver(function (state) { this.uiStateReceiver(state); }.bind(this));
    }

    frameCallback(now, metadata) {
        if (this.debugMode) {
            this.frameNo.innerHTML = metadata.presentedFrames + " " + metadata.presentationTime.toFixed(2);
        }
        this.viewModel.onVideoFrame(now, metadata);
        this.videoElement.requestVideoFrameCallback((now, metadata) => { this.frameCallback(now, metadata); });
    }

    uiStateReceiver(state) {
        if (state.createPlayer) {
            this.videoElement.srcObject = state.stream;
            this.videoElement.autoplay = true;
            this.videoElement.controls = true;
            this.videoElement.play().catch(error => {
                this.viewModel.onPlayerError(error);
            });
            this.videoElement.onloadedmetadata = () => {
                this.viewModel.clog("Video metadata loaded");
            };
            this.videoElement.oncanplay = () => {
                this.viewModel.clog("Video can play");
            };
            this.videoElement.onresize = () => {
                this.viewModel.onPlayerResize(this.videoElement.videoWidth, this.videoElement.videoHeight);
            };
            this.videoElement.onloadstart = () => {
                this.viewModel.clog("Video load started");
            };
            this.videoElement.onended = () => { this.viewModel.onPlayerFinishedPlayback(); };
            this.videoElement.onplaying = () => { this.viewModel.onPlayerStartPlaying(); }
            this.videoElement.ontimeupdate = (event) => {
                var totalVideoFrames = 0;
                var droppedVideoFrames = 0;
                if (this.playerLive) {
                    clearInterval(this.playerLive);
                }
                this.playerLive = setInterval(() => {
                    this.viewModel.onAppShutdown();
                }, this.playerCheckIntervalMs);
                if (this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    const quality = this.videoElement.getVideoPlaybackQuality();
                    totalVideoFrames = quality.totalVideoFrames;
                    droppedVideoFrames = quality.droppedVideoFrames;
                }
                this.viewModel.onPlayerCurrentTime(this.videoElement.currentTime, totalVideoFrames, droppedVideoFrames);
            };
            this.videoElement.addEventListener('play', () => {
                this.videoElement.requestVideoFrameCallback((now, metadata) => { this.frameCallback(now, metadata); });
            });
            // document.getElementById('remoteVideos').appendChild(this.videoElement);
            this.viewModel.onPlayerCreated();
        }
        if (state.updateVideoStatus && this.debugMode) {
            this.viewModel.onVideoStatusUpdated();
            if (!this.videoElement.videoWidth || (typeof this.videoElement.videoWidth === 'undefined')) {
                return;
            }
            if (this.videoElement && this.videoElement.videoWidth) {
                let width = this.videoElement.videoWidth;
                let height = this.videoElement.videoHeight;
                let status = document.getElementById("status");
                status.innerHTML = width + " x " + height +
                    `<br/>Player: ${state.fps.toFixed(2)}fps, ${state.droppedFramesPlayer} dropped of ${state.totalFramesPlayer}` +
                    `<br/>Codec: ${state.videoCodecStr}` +
                    `<br/>RTP: ${state.rtpStr}`;
                if (state.transportStr != "")
                    status.innerHTML += `<br/>Transport: ${state.transportStr}`;
                status.style.display = "block";
            }
        }
    }
}
