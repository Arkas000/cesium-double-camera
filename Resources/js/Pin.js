/**
 *
 * @param properties
 * @constructor
 * cameraDirection
 */
function Pin(viewer, properties) {
    this._viewer = viewer;
    this.idx = properties.idx;
    this.position = properties.position;
    this.offsetTime = properties.offsetTime;

    var that = this;
    this._entity =  viewer.entities.add({
        position : new Cesium.CallbackProperty(
            function(time) {
                return that.position;
            },
            false),
        point : {
            pixelSize : 8,
            color : Cesium.Color.TRANSPARENT,
            outlineColor : Cesium.Color.YELLOW,
            outlineWidth : 3
        }
    });

    this._savedCartographicPosition = null;

    this.upToDate = true;

    this._controls = null;

    this._viewer.clock.onTick.addEventListener(endAction, this);
}

Pin.prototype.move = function(position) {
    this.position = position;
    this.upToDate = false;
}

Pin.prototype.showControls = function() {
    if(!this._controls) {
        this._controls = new PinControls(this._viewer, this.position);
    }
    this._controls.show();
    console.log("show");
}

Pin.prototype.hideControls = function() {
    console.log("hide");
    this._controls.hide();
}


/*//it has to be called when an action begins
Pin.prototype.beginAction = function() {
    this._savedCartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
}*/

Pin.prototype.performAction = function(initialPosition, finalPosition) {
    var distance = Cesium.Cartesian3.distance(this._viewer.camera.position, this.position);

    //save the position at the beginning of the action
    if(this._controls._heightArrowSelected) {
        if(!this._savedCartographicPosition) {
            this._savedCartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
        }

        var cartographic = this._savedCartographicPosition.clone();
        cartographic.height += (initialPosition.y - finalPosition.y) * (distance*0.0006);
        if(cartographic.height < 30) {
            cartographic.height = 30;
        }

        this.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        this._controls.position = this.position;

        this.upToDate = false;
    } else if(this._controls._yArrowSelected){
        if(!this._savedCartographicPosition) {
            this._savedCartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
        }

        var cartographic = this._savedCartographicPosition.clone();
        cartographic.latitude += (initialPosition.y - finalPosition.y)*0.000001 * (distance*0.0001);
        this.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        this._controls.position = this.position;

        this.upToDate = false;
    } else if(this._controls._xArrowSelected) {
        if(!this._savedCartographicPosition) {
            this._savedCartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
        }

        var cartographic = this._savedCartographicPosition.clone();
        cartographic.longitude += (finalPosition.x - initialPosition.x)*0.000001  * (distance*0.0001);
        this.position = Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
        this._controls.position = this.position;

        this.upToDate = false;
    }
    //console.log(initialPosition + " || " + finalPosition);
}

//it has to be called when an action is ended
var endAction = function() {
    //reset the position to undefined when mouse is not pressed
    if(this._controls && !this._controls._leftDown && this._savedCartographicPosition) {
        this._savedCartographicPosition = undefined;
    }
}