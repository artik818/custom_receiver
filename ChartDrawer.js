export class ChartDrawer {
    constructor(chartElementName) {
        this.htmlCanvas = document.getElementById(chartElementName);
        this.htmlCanvasCtx = this.htmlCanvas.getContext('2d');
        this.htmlCanvasCtx.clearRect(0, 0, this.htmlCanvas.width, this.htmlCanvas.height);
        this.baseValue = 1000/29.97;
    }

    drawChart(frameDeltasList, fullRms) {
        const context2d = this.htmlCanvas.getContext('2d');
        const canvasWidth = this.htmlCanvas.width;
        const canvasHeight = this.htmlCanvas.height;
        const stepWidth = canvasWidth / frameDeltasList.length;
        context2d.clearRect(0, 0, canvasWidth, canvasHeight);

        context2d.beginPath();
        context2d.moveTo(0, 30);
        context2d.lineTo(canvasWidth+10, 30);
        context2d.lineTo(canvasWidth+10, 60);
        context2d.lineTo(0, 60);
        context2d.strokeStyle = 'red';
        context2d.lineWidth = 1;
        context2d.stroke();
        
        if (frameDeltasList.length > 0) {
            context2d.beginPath();
            context2d.moveTo(0, frameDeltasList[0]);
            let sqSum = 0.0;
            frameDeltasList.forEach((delta, index) => {
                const x = stepWidth * index;
                const y = delta;
                context2d.lineTo(x, y);
                sqSum += Math.pow(delta - this.baseValue, 2);
            });
            context2d.strokeStyle = 'green';
            context2d.lineWidth = 1;
            context2d.stroke();
            sqSum = Math.sqrt(sqSum / frameDeltasList.length);
            context2d.fillStyle = 'white';
            context2d.font = '14px Arial';
            context2d.fillText(`RMS: ${sqSum.toFixed(2)} FRMS: ${fullRms.toFixed(2)}`, 10, 18);
        }
    }
}