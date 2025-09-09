import { View } from './View.js';

export class ChromecastView extends View {
    constructor(viewModel, castContext, debugMode) {
        super(viewModel, debugMode);
        this.castContext = castContext;
        this.castContext.getPlayerManager().setMediaElement(this.videoElement);
    }

    uiStateReceiver(state) {
        super.uiStateReceiver(state);
        if (state.createPlayer) {
            this.viewModel.clog("CAPABILITIES " + JSON.stringify(cast.framework.CastReceiverContext.getInstance().getDeviceCapabilities()));
            this.viewModel.clog("APP " + JSON.stringify(cast.framework.CastReceiverContext.getInstance().getApplicationData()));
        }
        if (state.closeapp) {
            this.viewModel.clog("Close app requested");
            this.viewModel.onAppCloseHandled();
            this.castContext.stop();
        }
    }
}
