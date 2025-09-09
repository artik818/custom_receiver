import { ViewModelBase } from './ViewModelBase.js';

export class ViewModel extends ViewModelBase {
    constructor(args) {
        super(args)
    }

    onSourceSelected(id) {
        this.mcamBackend.onButtonClick(id)
            .then(() => {
                clog("Select camera " + id);
            })
            .catch(err => {
                clog("onSourceSelected Error: " + err);
            });
    }
}