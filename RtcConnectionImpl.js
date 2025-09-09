import { RtcConnectionItf } from './interfaces.js';

export class RtcConnectionImpl extends RtcConnectionItf {
    init({onGotVideoStreamFnc, clogObject}) {
        this.rtcPeerConnection = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'},
                {urls: "stun:stun1.l.google.com:19302"},
                {urls: "stun:stun.nextcloud.com:3478"},
                {urls: "stun:stun.voip.blackberry.com:3478"}
            ]
        });
        this.setRtcPeerConnectionCallbacks();
        this.onGotVideoStreamFnc = onGotVideoStreamFnc;
        this.clogObject = clogObject;
        this.offerHandlingDelayMs = 1000; // 1 second
    }

    setRtcPeerConnectionCallbacks() {
        this.rtcPeerConnection.onconnectionstatechange = function(event) {
            // clog("connection state: " + JSON.stringify(event));
        }

        this.rtcPeerConnection.onicecandidate = function(event) {
            // if (event.candidate) {
            //     this.logFunction("ICE candidate: " + event.candidate.candidate);
            // } else {
            //     this.logFunction("All ICE candidates have been sent.");
            // }
        }

        this.rtcPeerConnection.oniceconnectionstatechange = (event) => {
            this.clogObject.add("ICE connection state: " + this.rtcPeerConnection.iceConnectionState);
        }

        this.rtcPeerConnection.ontrack = (event) => {
            this.clogObject.add("ontrack " + event.track.kind);
            event.streams.forEach(stream => {
                stream.getTracks().forEach(track => {
                    //this.logFunction(`ontrack2 Track kind: ${track.kind}, Track ID: ${track.id}`);
                    if (track.kind === 'video') { this.videoStream = stream; }
                });
            });
            this.onGotVideoStreamFnc(event.track.kind, this.videoStream)
        }
        // pc.oniceconnectionstatechange = e => clog("PC stet = " + pc.iceConnectionState)
    }

    handleOffer(offer) {
        this.clogObject.add("handleOffer: "); // + JSON.stringify(offer)
        return this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => this.rtcPeerConnection.createAnswer())
            .then(sdp => {
                let sdpString = sdp.sdp;
                
                // if (sdpString.includes('m=video')) {
                //      if (sdpString.includes('a=maxptime:')) {
                //          sdpString = sdpString.replace(/a=maxptime:\d+/, 'a=maxptime:1000');
                //      } else {
                //          // Find the video section and insert maxptime
                //          sdpString = sdpString.replace(/(m=video.*\r\n)/, '$1a=maxptime:1000\r\n');
                //      }
                // }
                // this.clog("Received answer: " + sdpString);
                sdp.sdp = sdpString;
                this.rtcPeerConnection.setLocalDescription(sdp); 
            })
            .then(() => new Promise(resolve => setTimeout(resolve, this.offerHandlingDelayMs))) // Wait for ICE gathering
    }

    getStats(selector) {
        return this.rtcPeerConnection.getStats(selector);
    }

    getLocalDescription() {
        return this.rtcPeerConnection.localDescription;
    }
}