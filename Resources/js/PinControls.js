function PinControls(viewer, position) {
    this._viewer = viewer;
    this.position = position;


    this._xArrow = null;
    this._yArrow = null;
    this._heightArrow = null;

    this._xArrowSelected = false;
    this._yArrowSelected = false;
    this._heightArrowSelected = false;

    this._xArrowMaterial = null;
    this._yArrowMaterial = null;
    this._heightArrowMaterial = null;

    this._xArrowSavedEmission = null;
    this._yArrowSavedEmission = null;
    this._heightArrowSavedEmission = null;

    this._mouseHandler = new Cesium.ScreenSpaceEventHandler(this._viewer.scene.canvas);

    this._leftDown = false;

    this.addHoverCheck();

    this._viewer.clock.onTick.addEventListener(syncPosition, this);
}

PinControls.prototype.show = function() {
    var that = this;
    if(!this._xArrow) {
        this._xArrow = this._createModel("Resources/gltf/myRedArrow.gltf", "red", 0, -90, 0);
        this._xArrow.readyPromise.then(function(model) {
            that._xArrowMaterial = that._xArrow.getMaterial('Red');
            that._xArrowMaterial.setValue('diffuse', Cesium.Cartesian4.fromColor(Cesium.Color.RED));
            that._xArrowSavedEmission = that._xArrowMaterial.getValue('emission').clone();
        });
    }
    this._xArrow.show = true;

    if(!this._yArrow) {
        this._yArrow = this._createModel("Resources/gltf/myRedArrow.gltf", "blue", 0, 0, -90);
        this._yArrow.readyPromise.then(function(model) {
            that._yArrowMaterial = that._yArrow.getMaterial('Red');
            that._yArrowMaterial.setValue('diffuse', Cesium.Cartesian4.fromColor(Cesium.Color.BLUE));
            that._yArrowSavedEmission = that._yArrowMaterial.getValue('emission').clone();
        });
    }
    this._yArrow.show = true;

    if(!this._heightArrow) {
        this._heightArrow = this._createModel("Resources/gltf/myRedArrow.gltf", "green", 0, 0, 0);
        this._heightArrow.readyPromise.then(function(model) {
            that._heightArrowMaterial = that._heightArrow.getMaterial('Red');
            that._heightArrowMaterial.setValue('diffuse', Cesium.Cartesian4.fromColor(Cesium.Color.GREEN));
            that._heightArrowSavedEmission = that._heightArrowMaterial.getValue('emission').clone();
        });
    }
    this._heightArrow.show = true;
}

var syncPosition = function() {
    if(this._xArrow && this._leftDown) {
        Cesium.Transforms.headingPitchRollToFixedFrame(this.position, 0,  Math.PI*(-0.5), 0, Cesium.Ellipsoid.WGS84, this._xArrow.modelMatrix);
    }
    if(this._yArrow && this._leftDown) {
        Cesium.Transforms.headingPitchRollToFixedFrame(this.position, 0,  0, Math.PI*(-0.5), Cesium.Ellipsoid.WGS84, this._yArrow.modelMatrix);
    }
    if(this._heightArrow && this._leftDown) {
        Cesium.Transforms.headingPitchRollToFixedFrame(this.position, 0, 0, 0, Cesium.Ellipsoid.WGS84, this._heightArrow.modelMatrix);
    }
}

//Function to create, visualize and return a 3D model entity
PinControls.prototype._createModel = function(url, name, heading, pitch, roll) {

    var _heading = Cesium.Math.toRadians(heading);
    var _pitch = Cesium.Math.toRadians(pitch);
    var _roll = Cesium.Math.toRadians(roll);
    var that = this;

    var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(that.position, _heading, _pitch, _roll);

    return this._viewer.scene.primitives.add(Cesium.Model.fromGltf({
        url : url,
        show : true,
        modelMatrix : modelMatrix,
        scale : 0.01,
        minimumPixelSize : 128,          // never smaller than 128 pixels
        allowPicking : true,
        debugShowBoundingVolume : false,
        debugWireframe : false
    }));
}

PinControls.prototype.hide = function() {
    if(this._xArrowSelected){
        this._xArrowMaterial.setValue('emission', this._xArrowSavedEmission);
    }
    if(this._yArrowSelected){
        this._yArrowMaterial.setValue('emission', this._yArrowSavedEmission);
    }
    if(this._heightArrowSelected){
        this._heightArrowMaterial.setValue('emission', this._heightArrowSavedEmission);
    }

    if(this._xArrow)
        this._xArrow.show = false;
    if(this._yArrow)
        this._yArrow.show = false;
    if(this._heightArrow)
        this._heightArrow.show = false;

    this.removeHoverCheck();
}

PinControls.prototype.getModelForEntity = function(entity) {
    var primitives = this._viewer.scene.primitives;
    for (var i = 0; i < primitives.length; i++) {
        var primitive = primitives.get(i);
        if (primitive instanceof Cesium.Model) {
            if(primitive.id === entity)
                return primitive.id;
        }
    }
};

PinControls.prototype.addHoverCheck = function(){
    var that = this;
    this._mouseHandler.setInputAction(function(movement) {
        if(!that._leftDown) {
            var primitive;
            var pickedObject = that._viewer.scene.pick(movement.endPosition);
            if (pickedObject) {
                primitive = pickedObject.primitive;
                if (primitive instanceof Cesium.Model) {

                    //We don't use the entity here, but if you need to color based on
                    //some entity property, you can get to that data it here.
                    var mat = primitive.getMaterial('Red');

                    if (primitive === that._xArrow && !that._xArrowSelected) {
                        that._xArrowSelected = true;
                        that._yArrowSelected = false;
                        that._heightArrowSelected = false;
                    }
                    else if (primitive === that._yArrow && !that._yArrowSelected) {
                        that._xArrowSelected = false;
                        that._yArrowSelected = true;
                        that._heightArrowSelected = false;
                    }
                    else if (primitive === that._heightArrow && !that._heightArrowSelected) {
                        that._xArrowSelected = false;
                        that._yArrowSelected = false;
                        that._heightArrowSelected = true;
                    }
                    mat.setValue('emission', Cesium.Cartesian4.fromColor(Cesium.Color.YELLOW));
                    that._lastPick = pickedObject;
                }
                // deselect
                if (!that._xArrowSelected && that._xArrowMaterial) {
                    that._xArrowMaterial.setValue('emission', that._xArrowSavedEmission);
                }
                if (!that._yArrowSelected && that._yArrowMaterial) {
                    that._yArrowMaterial.setValue('emission', that._yArrowSavedEmission);
                }
                if (!that._heightArrowSelected && that._heightArrowMaterial) {
                    that._heightArrowMaterial.setValue('emission', that._heightArrowSavedEmission);
                }
                //that._lastPick = undefined;
            }
            else {
                if (that._xArrowSelected) {
                    that._xArrowMaterial.setValue('emission', that._xArrowSavedEmission);
                    that._xArrowSelected = false;
                }
                if (that._yArrowSelected) {
                    that._yArrowMaterial.setValue('emission', that._yArrowSavedEmission);
                    that._yArrowSelected = false;
                }
                if (that._heightArrowSelected) {
                    that._heightArrowMaterial.setValue('emission', that._heightArrowSavedEmission);
                    that._heightArrowSelected = false;
                }
            }
        }
        //Perform an action with the selected control
        else {
           //...
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this._mouseHandler.setInputAction(function (click) {
        that._leftDown = true;
        if(that._xArrowSelected || that._yArrowSelected || that._heightArrowSelected) {
            that._viewer.scene.screenSpaceCameraController.enableRotate = false;
            that._viewer.scene.screenSpaceCameraController.enableTranslate = false;
            that._viewer.scene.screenSpaceCameraController.enableZoom = false;
            that._viewer.scene.screenSpaceCameraController.enableTilt = false;
            that._viewer.scene.screenSpaceCameraController.enableLook = false;
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    this._mouseHandler.setInputAction(function (click) {
        that._leftDown = false;
        that._viewer.scene.screenSpaceCameraController.enableRotate = true;
        that._viewer.scene.screenSpaceCameraController.enableTranslate = true;
        that._viewer.scene.screenSpaceCameraController.enableZoom = true;
        that._viewer.scene.screenSpaceCameraController.enableTilt = true;
        that._viewer.scene.screenSpaceCameraController.enableLook = true;

    }, Cesium.ScreenSpaceEventType.LEFT_UP);
}

PinControls.prototype.removeHoverCheck = function(){
    /*this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this._mouseHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);*/
}

//it should not be necessary if the initial position property is updated
PinControls.prototype.move = function(position) {
    this.position = position;
}

