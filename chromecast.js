import { ViewModelBase } from './ViewModelBase.js';
import { McamChromecastBackend } from './McamChromecastBackend.js';
import { RtcConnectionImpl } from './RtcConnectionImpl.js';
import { Repo } from './Repo.js';

export class RepoImpl extends Repo {
    constructor(clogObject) {
        super();
        this.clogObject = clogObject;
        this.rtcConnection = new RtcConnectionImpl();
        this.castReceiverContext = cast.framework.CastReceiverContext.getInstance();
        this.backend = new McamChromecastBackend({
            context: this.castReceiverContext,
            urn: 'urn:x-cast:com.example.custom',
            clogObject: this.clogObject
        });
        this.castReceiverContext.setLoggerLevel(cast.framework.LoggerLevel.DEBUG);
        this.castDebugLogger = cast.debug.CastDebugLogger.getInstance();
        this.castDebugLogger.setEnabled(true);
        this.castDebugLogger.showDebugLogs(true);
        this.castDebugLogger.clearDebugLogs();

        this.viewModel = new ViewModelBase({
            repo: this,
        });
    }
    getLog() {
        return this.clogObject;
    }
    getRtcConnection() {
        return this.rtcConnection;
    }
    getBackend() {
        return this.backend;
    }
    getViewModel() {
        return this.viewModel;
    }
    getCastContext() {
        return this.castReceiverContext;
    }
    getCastDebugLogger() {
        return this.castDebugLogger;
    }
}
