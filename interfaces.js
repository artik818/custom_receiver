export class McamBackend {
    constructor() {}
    start() { throw new Error("start not implemented"); }
    stop() { throw new Error("stop not implemented"); }
    setOnLostSender(onLostSender) { throw new Error("setOnLostSender not implemented"); }
    async getOffer() { throw new Error("getOffer not implemented"); }
    async sendAnswer(answer) { throw new Error("sendAnswer not implemented"); }
    async sendLog(log) { throw new Error("sendLog not implemented"); }
    async updateVideoStatus(jsonData) { throw new Error("updateVideoStatus not implemented"); }
    async sendAppShutdown() { throw new Error("sendAppShutdown not implemented"); }
}

export class RtcConnectionItf {
    init({onGotVideoStreamFnc}) { throw new Error("init not implemented"); }
    setRtcPeerConnectionCallbacks() { throw new Error("setRtcPeerConnectionCallbacks not implemented"); }
    handleOffer(offer) { throw new Error("handleOffer not implemented"); }
    getStats(selector) { throw new Error("getStats not implemented"); }
    getLocalDescription() { throw new Error("getLocalDescription not implemented"); }
}
