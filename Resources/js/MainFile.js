var mainViewer;
var secondViewer;
"use strict";

if (typeof Cesium !== "undefined") {
    startup(Cesium);
} else if (typeof require === "function") {
    require(["Cesium"], startup);
}

function startup(Cesium) {
    // ---------------------------------------------------------
    // ------------------ Main Viewer Setup --------------------
    // ---------------------------------------------------------
    mainViewer = new Cesium.Viewer('cesiumContainer', {
        timeline : true,
        animation : true,
        contextOptions: {
            webgl:{preserveDrawingBuffer:true}
        }
    });

    mainViewer.clock.shouldAnimate = true;
    mainViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    mainViewer.scene.debugShowFramesPerSecond = true;
    mainViewer.scene.globe.depthTestAgainstTerrain = true;

    mainViewer.terrainProvider = new Cesium.CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    mainViewer.scene.globe.enableLighting = true;

    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // ----------------- Second Viewer Setup -------------------
    // ---------------------------------------------------------
    secondViewer = new Cesium.Viewer('cesiumContainer2', {
        timeline : false,
        animation : false,
        creditContainer: "hiddenCredits",
        infoBox: false,
        homeButton: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        geocoder: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        scene3DOnly: true,

        contextOptions: {
            webgl:{preserveDrawingBuffer:true}
        }

    });

    secondViewer.scene.screenSpaceCameraController.enableRotate = false;
    secondViewer.scene.screenSpaceCameraController.enableTranslate = false;
    secondViewer.scene.screenSpaceCameraController.enableZoom = false;
    secondViewer.scene.screenSpaceCameraController.enableTilt = false;
    secondViewer.scene.screenSpaceCameraController.enableLook = false;

    secondViewer.clock.shouldAnimate = false;
    //secondViewer.scene.debugShowFramesPerSecond = true;
    secondViewer.scene.globe.depthTestAgainstTerrain = true;

    secondViewer.terrainProvider = new Cesium.CesiumTerrainProvider({
        url : '//assets.agi.com/stk-terrain/world',
        requestWaterMask : true,
        requestVertexNormals : true
    });
    secondViewer.scene.globe.enableLighting = true;
    secondViewer.camera.lookUp(1.3);

    // -----------------------------------------------------

    function getTileLevel(cartographic)
    {
        var selectedTile;
        var tilesRendered = mainViewer.scene.globe._surface.tileProvider._tilesToRenderByTextureCount;
        for (var textureCount = 0; !selectedTile && textureCount < tilesRendered.length; ++textureCount) {
            var tilesRenderedByTextureCount = tilesRendered[textureCount];
            if (tilesRenderedByTextureCount == undefined) {
                continue;
            }
            for (var tileIndex = 0; !selectedTile && tileIndex < tilesRenderedByTextureCount.length; ++tileIndex) {
                var tile = tilesRenderedByTextureCount[tileIndex];
                if (Cesium.Rectangle.contains(tile.rectangle, cartographic)) {
                    selectedTile = tile;
                }
            }
        }
        if(selectedTile)
            return selectedTile._level;
        else
            return 6;
    }


    var cameraController = new CameraController(mainViewer, true);

    var waitForCesium = setInterval(function() {
        if (Cesium) {
            clearInterval(waitForCesium);
            cameraController.initialize("path");
            cameraController.attachViewer(secondViewer);
            //cameraController.attachViewer(mainViewer);

            /*cameraController._mouseHandler.setInputAction(function(click) {
                console.log("left");
                cameraController.detachViewer(mainViewer);
            },Cesium.ScreenSpaceEventType.LEFT_CLICK);*/
        }
    }, 20);

;


    //Sandcastle_End
    Sandcastle.finishedLoading();
}