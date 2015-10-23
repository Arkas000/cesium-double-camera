function CameraController(viewer) {
    this._viewer = viewer;
    this._mouseHandler = null;
    this._cameraPath = null;
    this._entity = null;
    this._lookAtEntity = null;

    this._leftDown = false;
    this._attachedViews = [];

    this._viewer.clock.onTick.addEventListener(syncFun, this);
}
var pippo;
/**
 * Use this function to chose what type of cameraController will be used
 * @param type (string): mouse | path
 */
CameraController.prototype.initialize = function(type) {
    if(!this._mouseHandler) {
        this._mouseHandler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);
    }

    if(type == "path") {
        this.resetHandler();
        this._entity = this._viewer.entities.add({
            id: "cameraController",
            position : Cesium.Cartesian3.fromDegrees(-40,-30,1000),
            billboard : {
                scale: 0.1,
                image : "Resources/img/camera.png",
            },
            path : {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.YELLOW
                }),
                width: 10
            }
        });
        this.enableCurveGeneration();
    } else if (type == "mouse") {
        this.resetHandler();
        this._entity = this._viewer.entities.add({
            id: "cameraController",
            position : Cesium.Cartesian3.fromDegrees(-40,-30,1000),
            billboard : {
                scale: 0.1,
                image : "Resources/img/camera.png",
            }
        });
        this.enableDragAndDrop();
    }
}

CameraController.prototype.getCurrentPosition = function(){
    //toCheck
    var position = this._entity.position.getValue(this._viewer.clock.currentTime);
    if(position)
        return position;
    else
        return new Cesium.Cartesian3.fromDegrees(-40,-30,1000);
}

CameraController.prototype.enableCurveGeneration = function() {
    var that = this;
    this._cameraPath = new CameraPath(this._viewer);
    this._mouseHandler.setInputAction(function(click) {
        console.log("right");
        //pick a control point for the curve
        var ellipsoid = that._viewer.scene.globe.ellipsoid;
        var cartesian = that._viewer.camera.pickEllipsoid(click.position, ellipsoid);
        if (cartesian) {
            var delay = 6;
            if(that._cameraPath.length() == 0)
                delay = 0;

            var pin = that._cameraPath.addPin(cartesian, delay);

            if(that._cameraPath.length() == 1) {
                that._viewer.clock.startTime = that._viewer.clock.currentTime;
            } else {
                that._viewer.clock.stopTime = that._cameraPath.getStopTime(that._viewer.clock.startTime);
            }

            that._entity.position = that._cameraPath.getPositions(that._viewer.clock.startTime);

            that._entity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start : that._viewer.clock.startTime,
                stop : that._viewer.clock.stopTime
            })]);


             //Get terrain height
             var cartographic = [Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian)];
             Cesium.sampleTerrain(mainViewer.terrainProvider, 9, cartographic)
             .then(
                 function(finalPosition) {
                     finalPosition[0].height+=200;
                     changeHeight(cartesian, finalPosition[0].height);
                     pin.move(cartesian);
                     that._entity.position = that._cameraPath.getPositions(that._viewer.clock.startTime);
                 }
             );
        }

    },Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    var pickedPin = null;
    this._mouseHandler.setInputAction(function(click) {
        console.log("left");

        var tempPickedPin = that.pickPin(that._viewer, click.position);

        if(pickedPin){
            pickedPin.hideControls();
        }
        if(tempPickedPin) {
            tempPickedPin.showControls();
        }
        pickedPin = tempPickedPin;
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);

    var downClickPos;
    this._mouseHandler.setInputAction(function(click) {
        that._leftDown = true;
        downClickPos = click.position;
    },Cesium.ScreenSpaceEventType.LEFT_DOWN);

    this._mouseHandler.setInputAction(function(click) {
        that._leftDown = false;
    },Cesium.ScreenSpaceEventType.LEFT_UP);


    this._mouseHandler.setInputAction(function(movement) {
        if(that._leftDown && pickedPin) {  //pickedPin has to be changed: it generates bugs when selecting
            pickedPin.performAction(downClickPos, movement.endPosition);
        }
        if(!that._cameraPath._upToDate) {
            that._entity.position = that._cameraPath.getPositions(that._viewer.clock.startTime);
        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

CameraController.prototype.pickPin = function(viewer, windowPosition) {
    var picked = viewer.scene.pick(windowPosition);
    if (picked) {
        var id = Cesium.defaultValue(picked.id, picked.primitive.id);
        if (id instanceof Cesium.Entity) {
            return this._cameraPath.pickPinByEntity(id);
        }
    }
    return undefined;
};



CameraController.prototype.enableDragAndDrop = function() {
    var selectedObject = undefined;
    var that = this;
    this._mouseHandler.setInputAction(function(click) {
        var pickedObject = mainViewer.scene.pick(click.position);
        //if the emitter is selected, then activate the movement
        if (Cesium.defined(pickedObject) && pickedObject.id.id == "cameraController" && !selectedObject) {
            that.mouseMoveOn();
            selectedObject = pickedObject;
        } else if(selectedObject) {
            that.mouseMoveOff();
            selectedObject = undefined;
        }
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

CameraController.prototype.mouseMoveOn = function() {
    this._mouseHandler.setInputAction(function(movement) {
        var ellipsoid = mainViewer.scene.globe.ellipsoid;
        var cartesian = mainViewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
            //...

        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

/**
 * Deactivates the movement
 */
CameraController.prototype.mouseMoveOff = function() {
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

CameraController.prototype.resetHandler = function() {
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);

}

CameraController.prototype.attachViewer = function(viewer) {
    //Bound position of cameraController to lastKnownPosition variable
    this._attachedViews.push(viewer);
};

CameraController.prototype.detachViewer = function(viewer) {
    //Unbound position of cameraController to lastKnownPosition variable
    var index = this._attachedViews.indexOf(viewer);
    if (index > -1) {
        this._attachedViews.splice(index, 1);
    }
};

CameraController.prototype.setPathVisible = function(visible) {
    if(visible) {

    } else {

    }
}

CameraController.prototype.destroy = function() {
    this._viewer.clock.onTick.removeEventListener(syncFun, this);
    if(this._mouseHandler)
        this._mouseHandler.destroy();
    if(this._entity)
        this._entity.destroy();
    if(this._cameraPath)
        this._cameraPath.destroy();
    if(this._lookAtEntity)
        this._lookAtEntity.destroy();
    this._attachedViews = undefined;
}

var syncFun = function(clock) {
    for(var i = 0; i < this._attachedViews.length; i++) {
        this._attachedViews[i].camera.setView({
            position: this.getCurrentPosition()
        });
    }
}

function changeHeight(cartesian, height) {
    var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
    cartographic.height = height;
    var cartesian2 = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
    cartesian.x = cartesian2.x;
    cartesian.y = cartesian2.y;
    cartesian.z = cartesian2.z;
}