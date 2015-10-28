/**
 * This is the main Object that enables the controls for creating a path and to make the camera follow it
 * @param viewer
 * @constructor
 */
function CameraController(viewer) {
    this._viewer = viewer;
    this._mouseHandler = null;

    this._cameraPath = null;
    this._entity = null;

    this._lookAtPath = null,
    this._lookAtEntity = null;

    this._leftDown = false;
    this._attachedViews = [];

    this._viewer.clock.onTick.addEventListener(syncFun, this);

    this._recBtn = undefined;
}
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
                resolution: 0.2,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.YELLOW
                }),
                width: 10
            },
            show: false

        });

        this._lookAtEntity = this._viewer.entities.add({
            id: "cameraTarget",
            position : Cesium.Cartesian3.fromDegrees(-40.1,-30.1,1000),
            billboard : {
                scale: 0.1,
                image : "Resources/img/target.png",
            },
            path : {
                resolution: 0.2,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.RED
                }),
                width: 10
            },
            show: false
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
    if(this._entity) {
        var position = this._entity.position.getValue(this._viewer.clock.currentTime);
        if (position)
            return position;
    }

    return new Cesium.Cartesian3.fromDegrees(-40,-30,1000);
}

CameraController.prototype.getCurrentLookAtPosition = function(){
    //toCheck
    if(this._lookAtEntity) {
        var position = this._lookAtEntity.position.getValue(this._viewer.clock.currentTime);
        if (position)
            return position;
    }
    return new Cesium.Cartesian3.fromDegrees(-40.01,-30.01,1000);
}

CameraController.prototype.enableCurveGeneration = function() {
    var that = this;
    this._cameraPath = new CameraPath(this._viewer);
    this._lookAtPath = new CameraPath(this._viewer);

    this._mouseHandler.setInputAction(function(click) {
        //pick a control point for the curve
        var ellipsoid = that._viewer.scene.globe.ellipsoid;
        var cartesian = that._viewer.camera.pickEllipsoid(click.position, ellipsoid);
        if (cartesian) {
            var delay = 6;
            if(that._cameraPath.length() == 0) {
                delay = 0;
            }

            //var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);

            var pin = that._cameraPath.addPin(cartesian, delay);
            var lookAtPin = that._lookAtPath.addPin(cartesian, delay);

            that._entity.show = true;
            that._lookAtEntity.show = true;

            //First point added
            if(that._cameraPath.length() == 1) {
                that._viewer.clock.startTime = that._viewer.clock.currentTime;
            } else {
                that._viewer.clock.stopTime = that._cameraPath.getStopTime(that._viewer.clock.startTime);
            }

            if(that._cameraPath.length() == 2) {
                if(that._attachedViews.length > 0) {
                    var interval = null;
                    //create a button to record
                    that._recBtn = document.createElement("button");
                    that._recBtn.appendChild(document.createTextNode("\u25CF Rec"));
                    that._recBtn.id = "recBtn";

                    var thatX = that;
                    //Add listener to the button to activate the recording function
                    that._recBtn.addEventListener('click', function () {
                        var targetContainer = "#" + thatX._attachedViews[0]._container.id;
                        //get the target canvas
                        var canvas = ($(targetContainer).find('div').filter('[class=cesium-widget]')).find('canvas');
                        var fps = 24;
                        var recorder = new Movie( canvas[0], fps );
                        thatX._viewer.clock.shouldAnimate = false;
                        thatX._viewer.clock.currentTime = thatX._viewer.clock.startTime;
                        //var totalTime = Cesium.JulianDate.compare(thatX._viewer.clock.stopTime, thatX._viewer.clock.startTime) * 1000;

                        // Record
                        var regInterval = setInterval(function() {
                            recorder.addFrame();

                            var updatedTime = Cesium.JulianDate.now();
                            Cesium.JulianDate.addSeconds(thatX._viewer.clock.currentTime, 1/fps, updatedTime);
                            if(Cesium.JulianDate.compare(thatX._viewer.clock.stopTime,updatedTime) >= 0) {
                                thatX._viewer.clock.currentTime = updatedTime;
                            }
                            else {
                                clearInterval(regInterval);
                                var result = recorder.stop();
                            }
                        },1000/fps);
                    }, false);
                    document.body.appendChild(that._recBtn);
                    applyStyleToButton("recBtn");
                }
            }

            that._entity.position = that._cameraPath.getPositions(that._viewer.clock.startTime);
            that._lookAtEntity.position = that._lookAtPath.getPositions(that._viewer.clock.startTime);

            that._entity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start : that._viewer.clock.startTime,
                stop : that._viewer.clock.stopTime
            })]);
            that._lookAtEntity.availability = new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start : that._viewer.clock.startTime,
                stop : that._viewer.clock.stopTime
            })]);


             //Get terrain height
             var cartographic = [Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian)];
             Cesium.sampleTerrain(mainViewer.terrainProvider, 12, cartographic)
             .then(
                 function(finalPosition) {
                     if(finalPosition[0].height) {
                         finalPosition[0].height += 2;
                     } else {
                         finalPosition[0].height = mainViewer.scene.globe.getHeight(finalPosition[0]);
                     }
                     changeHeight(cartesian, finalPosition[0].height);

                     pin.move(cartesian);
                     lookAtPin.move(cartesian);

                     that._entity.position = that._cameraPath.getPositions(that._viewer.clock.startTime);
                     that._lookAtEntity.position = that._lookAtPath.getPositions(that._viewer.clock.startTime);

                 }
             );
        }

    },Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    var pickedPin = null;
    this._mouseHandler.setInputAction(function(click) {
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
        if(!that._lookAtPath._upToDate) {
            that._lookAtEntity.position = that._lookAtPath.getPositions(that._viewer.clock.startTime);
        }
    },Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

CameraController.prototype.pickPin = function(viewer, windowPosition) {
    var picked = viewer.scene.pick(windowPosition);
    if (picked) {
        var id = Cesium.defaultValue(picked.id, picked.primitive.id);
        if (id instanceof Cesium.Entity) {
            var res = this._cameraPath.pickPinByEntity(id);
            if(res)
                return res;
            else
                return this._lookAtPath.pickPinByEntity(id);
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
            //ToDo

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

/**
 * This function attaches the camera of the given viewer to the CameraController
 * @param viewer
 */
CameraController.prototype.attachViewer = function(viewer) {
    //Bound position of cameraController to lastKnownPosition variable
    this._attachedViews.push(viewer);
};

/**
 * This function detaches the camera of the given viewer to the CameraController
 * @param viewer
 */
CameraController.prototype.detachViewer = function(viewer) {
    //Unbound position of cameraController to lastKnownPosition variable
    var index = this._attachedViews.indexOf(viewer);
    if (index > -1) {
        this._attachedViews.splice(index, 1);
    }
};


CameraController.prototype.showPath = function(visible) {
    if(visible) {
//ToDo
    } else {
//ToDo
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
    if(this._lookAtPath)
        this._lookAtPath.destroy();
    this._attachedViews = undefined;
}

var syncFun = function(clock) {
    var cameraPosition = this.getCurrentPosition();
    var lookAtPosition = this.getCurrentLookAtPosition();

    var cartoCameraPos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cameraPosition);
    var cartoLookAtPos = Cesium.Ellipsoid.WGS84.cartesianToCartographic(lookAtPosition);

    var dX = lookAtPosition.x - cameraPosition.x;
    var dY = lookAtPosition.y - cameraPosition.y;
    var dZ = lookAtPosition.z - cameraPosition.z;

    var dXc = cartoCameraPos.longitude - cartoLookAtPos.longitude;
    var dYc = cartoCameraPos.latitude - cartoLookAtPos.latitude;

    // calculate the yaw:
    var yaw = Math.atan2(dXc, dYc) + Math.PI;


    //calculate the pitch:
    var a2 = Cesium.Cartesian3.distanceSquared(cameraPosition,lookAtPosition);
    var dPosCC = Cesium.Cartesian3.distance(cameraPosition,Cesium.Cartesian3.ZERO);
    var dPosLC = Cesium.Cartesian3.distance(lookAtPosition,Cesium.Cartesian3.ZERO);
    var c = Math.abs(dPosCC - dPosLC);
    var b = Math.sqrt(a2 - c*c);
    var pitch = Math.atan2(c,b);
    if(dPosLC < dPosCC)
        pitch*=-1;

    for(var i = 0; i < this._attachedViews.length; i++) {
        this._attachedViews[i].camera.setView({
            position: cameraPosition,
            heading : yaw,
            pitch : pitch
        });

        //this._attachedViews[i].camera.direction = Cesium.Cartesian3.fromDegrees(40,40);

    }
}

/**
 * A function to change the height of a cartesian3 value
 * @param cartesian
 * @param height
 */
function changeHeight(cartesian, height) {
    var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
    cartographic.height = height;
    var cartesian2 = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
    cartesian.x = cartesian2.x;
    cartesian.y = cartesian2.y;
    cartesian.z = cartesian2.z;
}

function applyStyleToButton(buttonId) {
    var $recBtn = $("#"+buttonId);

    var style = "position:absolute; box-shadow: rgb(255, 255, 255) 0px 1px 0px 0px inset; " +
        "border-radius: 6px; border: 1px solid rgb(220, 220, 220); display: inline-block; " +
        "cursor: pointer; color: rgb(255, 0, 0); font-family: Arial; font-size: 15px; font-weight: bold; " +
        "padding: 6px 11px; text-decoration: none; text-shadow: rgb(255, 255, 255) 0px 1px 0px; " +
        "background: linear-gradient(rgb(249, 249, 249) 5%, rgb(233, 233, 233) 100%) rgb(249, 249, 249);"
    $recBtn.attr("style", style);


}