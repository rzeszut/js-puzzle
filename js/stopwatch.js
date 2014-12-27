function StopWatch() {
    this.startTime = null;
    this.stopTime = null;
}

StopWatch.prototype.start = function () {
    this.startTime = new Date();
}

StopWatch.prototype.stop = function () {
    if (!this.startTime) {
        return;
    }
    this.stopTime = new Date();
}

StopWatch.prototype.clear = function () {
    this.startTime = null;
    this.stopTime = null;
}

StopWatch.prototype.getTime = function () {
    if (!this.stopTime) {
        return 0;
    }
    return this.stopTime.getTime() - this.startTime.getTime();
}

StopWatch.prototype.getSeconds = function () {
    return Math.round(this.getTime() / 1000);
}

StopWatch.prototype.getMinutes = function () {
    return Math.round(this.getTime() / (1000 * 60));
}

StopWatch.prototype.getHours = function () {
    return Math.round(this.getTime() / (1000 * 60 * 60));
}

