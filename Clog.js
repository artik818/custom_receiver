
export class ClogItf {
    add(message) { throw new Error("add not implemented"); }
    clear() { throw new Error("clear not implemented"); }
}

export class ClogImpl extends ClogItf {
    constructor({
        htmlElement,
        maxLines,
        logsBlockElement,
        onScreenTime
    }) {
        super();
        this.logs = [];
        this.htmlElement = htmlElement;
        this.maxLines = maxLines;
        this.statusTime = null;
        this.logsBlockElement = logsBlockElement;
        this.onScreenTime = onScreenTime || 10000; // Default to 10 seconds if not provided
    }

    add(message) {
        this.logs.push(message);
        console.log(message);
        while (this.logs.length > this.maxLines) {
            this.logs.shift();
        }
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        if (this.htmlElement) {
            this.htmlElement.innerHTML = this.logs.join("<br/>");
            this.htmlElement.scrollTop = this.htmlElement.scrollHeight;
        }
        clearTimeout(this.statusTime);
        this.logsBlockElement.style.display = "block"; // Ensure it's visible when a new message arrives
        this.statusTime = setTimeout(() => {
            this.logsBlockElement.style.display = "none";
        }, this.onScreenTime);

    }

    clear() {
        this.logs = [];
        this.updateLogDisplay();
    }
}

export class ConsoleClogImpl extends ClogItf {
    add(message) {
        console.log(message);
    }
}
