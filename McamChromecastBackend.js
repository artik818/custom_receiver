import { McamBackend } from './interfaces.js';

export class McamChromecastBackend extends McamBackend {
    constructor({context, urn, clogObject}) {
        super();
        this.urn = urn;
        this.context = context;
        this._offerResolve = null;
        this._offerReject = null;
        this.onLostSender = null;
        this.senderId = null;
        this.ping = null;
        this.clogObject = clogObject;

        this.context.addEventListener(
            cast.framework.system.EventType.SENDER_DISCONNECTED, 
            () => {
                if (this.onLostSender) {
                    this.onLostSender();
                }
            }
        );

        this.context.addCustomMessageListener(urn, (event) => {
            // clog("Got message from sender: " + JSON.stringify(event));
            try {
                this.senderId = event.senderId;
                var data = event.data
                var cmd = data.cmd
                // clog("B01");
                if (cmd == "offer") {
                    this._offerResolve(data.data);
                }
            } catch (e) {
                this.clogObject.add("B0E " + e);
            }
        });
    }

    start() {
        this.clogObject.add("start()");
        const castReceiverOptions = new cast.framework.CastReceiverOptions();
        castReceiverOptions.maxInactivity = 20;
        castReceiverOptions.disableIdleTimeout = true;
        this.context.start(castReceiverOptions);
        this.ping = setInterval(() => {
                //castDebugLogger.debug("MSG", message);
                this.context.sendCustomMessage(this.urn, this.senderId, { "cmd": "ping" });
            }, 5000);
    }

    stop() {
        this.clogObject.add("stop()");
        if (this.ping) {
            clearInterval(this.ping);
            this.ping = null;
        }
        this._offerResolve = null;
        this._offerReject = null;
        this.senderId = null;
        this.context.stop();
    }

    async getOffer() {
        this.clogObject.add("Wait offer");
        return new Promise((resolve, reject) => {
            this._offerResolve = resolve;
            this._offerReject = reject;
        });
    }
    async sendAnswer(answer) {
        this.clogObject.add("Send answer");
        return new Promise((resolve, reject) => {
            this.context.sendCustomMessage(this.urn, this.senderId, {"cmd": "answer", "data" : answer});
            resolve(0);
        });
    }

    async onButtonClick(buttonId) {
        throw new Error("onButtonClick not implemented");
    }

    async sendLog(log) { 
        return new Promise((resolve, reject) => {
            this.context.sendCustomMessage(this.urn, this.senderId, {"cmd": "log", "data" : { "message": log }});
            resolve(0);
        });
    }
    async updateVideoStatus(jsonData) { 
        return new Promise((resolve, reject) => {
            this.context.sendCustomMessage(this.urn, this.senderId, {"cmd": "videostatus", "data" : jsonData});
            resolve(0);
        });
    }
    async sendAppShutdown() { 
        return new Promise((resolve, reject) => {
            this.context.sendCustomMessage(this.urn, this.senderId, {"cmd": "shutdown"});
            resolve(0);
        });
    }
    setOnLostSender(callback) {
        this.onLostSender = callback;
    }
}