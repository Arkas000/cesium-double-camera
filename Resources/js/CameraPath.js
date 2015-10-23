function CameraPath(viewer) {
    this._viewer = viewer;
    this._pinCollection = [];
    this._upToDate = false;
    this._positions = null;

    this._viewer.clock.onTick.addEventListener(updateCheck, this);
}

CameraPath.prototype.addPin = function(position, offsetTime) {
    var pin = new Pin(
        mainViewer,
        {
            position: position,
            offsetTime: offsetTime,
        }
    )
    this._pinCollection.push(pin);
    this._upToDate = false;
    return pin;
}

CameraPath.prototype.length = function() {
    return this._pinCollection.length;
}

/**
 * idx: pin index
 * position: new Cartesian3 position
 */
CameraPath.prototype.movePin = function(idx,position) {
    if(idx < this._pinCollection.length) {
        this._pinCollection[idx].move(position);
        this._upToDate = false;
    }
}

var updateCheck = function() {
    for(var i = 0; i < this._pinCollection.length; i++) {
        if(!this._pinCollection[i].upToDate){
            this._upToDate = false;
            this._pinCollection[i].upToDate = true;
        }
    }
}

/**
 * It returns the updated path as a Cesium.SampledPositionProperty
 * @returns {Cesium.SampledPositionProperty}
 */
CameraPath.prototype.getPositions = function(startTime) {
    if(!this._upToDate) {
        this._positions = new Cesium.SampledPositionProperty();
        this._positions.setInterpolationOptions({
            interpolationDegree : 3,
            interpolationAlgorithm : Cesium.LagrangePolynomialApproximation
        });

        var curTotalTime = 0;
        var stopTime = null;
        for (var i = 0; i < this._pinCollection.length; i++) {
            curTotalTime += this._pinCollection[i].offsetTime;
            stopTime = Cesium.JulianDate.clone(startTime);
            Cesium.JulianDate.addSeconds(startTime, curTotalTime, stopTime);
            this._positions.addSample(stopTime, this._pinCollection[i].position);
        }
        this._upToDate = true;
    }
    return this._positions;
}

CameraPath.prototype.getTimeByIndex = function(startTime, index) {
    if(index < this._pinCollection.length) {
        var totalTime = 0;
        for(var i = 0; i <= index; i++) {
            totalTime += this._pinCollection[i].offsetTime;
        }
        var stopTime = Cesium.JulianDate.clone(startTime);
        Cesium.JulianDate.addSeconds(startTime, totalTime, stopTime);
        return stopTime;
    }
    return null;
}

CameraPath.prototype.getStopTime = function(startTime) {
    return this.getTimeByIndex(startTime, this._pinCollection.length-1);
}

CameraPath.prototype.pickPinByEntity = function(entity) {
    for(var i = 0; i < this._pinCollection.length; i++) {
        if(this._pinCollection[i]._entity === entity) {
            return this._pinCollection[i];
        }
    }
    return null;
}

CameraPath.prototype.destroy = function() {
    this._viewer.clock.onTick.removeEventListener(updateCheck, this);
    for(var i = 0; i < this._pinCollection.length; i++) {
        this._pinCollection[i].destroy();
    }
    this._pinCollection = undefined;
}