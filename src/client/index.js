var stage;

var playerPos = [27.598505, 47.162098];//to rename to center pos
const playerWidth = 5;
var ZOOM = 60000;
var offsetx = 160;
var offsety = 90;

function getCoordinateX(point){
    return -(playerPos[0]-point)*ZOOM+offsetx;
}
function getCoordinateY(point){
    return (playerPos[1]-point)*ZOOM+ offsety;
}

var isRunning = false;
var idSet = new Set();
var buildings = [];

//Map
var map;
const deltaDistance = 500; // pixels the map pans when the up or down arrow is clicked
const deltaDegrees = 25; // degrees the map rotates when the left or right arrow is clicked
mapboxgl.accessToken = 'pk.eyJ1IjoiZmlyc3RzdGVmIiwiYSI6ImNrNzRneHkzbTBpaDQzZnBkZDY3dXRjaDQifQ.g6l-GFeBB2cUisg6MqweaA';

var playerGetPos = map => {
    return [
        [getCoordinateX(map.transform._center.lng) - playerWidth , getCoordinateY(map.transform._center.lat) - playerWidth],
        [getCoordinateX(map.transform._center.lng) - playerWidth, getCoordinateY(map.transform._center.lat) + playerWidth],
        [getCoordinateX(map.transform._center.lng) + playerWidth, getCoordinateY(map.transform._center.lat) + playerWidth],
        [getCoordinateX(map.transform._center.lng) + playerWidth , getCoordinateY(map.transform._center.lat) - playerWidth],
        [getCoordinateX(map.transform._center.lng) - playerWidth, getCoordinateY(map.transform._center.lat) - playerWidth]
    ];
};

//initializing objects

function init() {
    stage = new createjs.Stage("gameCanvas");
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    stage.update();
    stage.scaleX = 4;
    stage.scaleY = 4;

    let data = {
        images: ["./../sprites/spritesheet_grant.png"],
        frames: {
            width: 165,
            height: 292
        },
        animations: {
            idle: 0,
            "run": [0, 25, "run", 1.5],
            "jump": [26, 63, "run"]
        },
        framerate: 30
    };
    let spriteSheet = new createjs.SpriteSheet(data);
    let sprite = new createjs.Sprite(spriteSheet, "idle");
    sprite.name = "player";
    stage.addChild(sprite);

    let playerRect = new createjs.Shape();
    playerRect.graphics.beginStroke("green");
    playerRect.name = "playerRect";

    playerRect.graphics.moveTo(getCoordinateX(playerGetPos(map)[0][0]), getCoordinateY(playerGetPos(map)[0][1])).beginFill("green");
    playerGetPos(map).forEach(point => {
            playerRect.graphics.lineTo(point[0], point[1]);
        }
    );

    //drawPointArray(playerRect, playerGetPos());

    stage.addChild(playerRect);

    createjs.Ticker.on("tick", tick);
}

//update()
function tick(event) {
    stage.getChildByName("player").setTransform(130, 30, 0.2, 0.2);
    if (isRunning) {
        if (stage.getChildByName("player").currentAnimation !== "run")
            stage.getChildByName("player").gotoAndPlay("run");
    } else {
        if (stage.getChildByName("player").currentAnimation !== "idle")
            stage.getChildByName("player").gotoAndPlay("idle");
    }

    if (stage.getChildByName("playerRect") != null) {
        stage.getChildByName("playerRect").setTransform(getCoordinateX(map.transform._center.lng), getCoordinateY(map.transform._center.lat));
    }

    stage.update(event); // important!!
}

function setup(){
    createCanvas();
}

function easing(t) {
    return t * (2 - t);
}

function hash(obj){
    let stringified = JSON.stringify(obj);

    let hash = 0, i, chr;
    if (stringified.length === 0) return hash;
    for (i = 0; i < stringified.length; i++) {
        chr   = stringified.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function validateId(obj){
    let id = hash(obj);
    if (idSet.has(id))
        return false;
    idSet.add(id);
    return true;
}

function setMap(lat = 27.598505, long = 47.162098) {
    playerPos[0] = lat;
    playerPos[1] = long;
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [playerPos[0], playerPos[1]],
        zoom: 20
    });
    map.on('load', function() {
        map.loadImage(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png',
            function(error, image) {
                if (error) throw error;
                map.addImage('cat', image);
                map.addSource('point', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [{
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [0, 0]
                            }
                        }]
                    }
                });
                map.addLayer({
                    'id': 'points',
                    'type': 'symbol',
                    'source': 'point',
                    'layout': {
                        'icon-image': 'cat',
                        'icon-size': 0.25
                    }
                });
            }
        );


        map.getCanvas().focus();

        map.getCanvas().addEventListener(
            'keydown',
            function(e) {
                e.preventDefault();
                isRunning = true;
                if (e.which === 38) {
                    // up
                    map.panBy([0, -deltaDistance], {
                        easing: easing
                    });

                } else if (e.which === 40) {
                    // down
                    map.panBy([0, deltaDistance], {
                        easing: easing
                    });
                } else if (e.which === 37) {
                    // left
                    map.easeTo({
                        bearing: map.getBearing() - deltaDegrees,
                        easing: easing
                    });
                } else if (e.which === 39) {
                    // right
                    map.easeTo({
                        bearing: map.getBearing() + deltaDegrees,
                        easing: easing
                    });
                }

            },
            true
        );
    });


    setInterval(function() {

        var features = map.queryRenderedFeatures({
            /*sourceLayer: ["road", "building"]*/ }); // This is where I get building

        features.forEach(function(feature) {
            //console.log(feature.geometry);  // feature.geometry getter returns building shape points (basement)

            if (validateId(feature.geometry)){
                drawFeature(feature);
            }

            //console.log(feature);

            // Polygon has this format: Main[ Array[ Point[], Point[]... ], ...]
            // MultiPolygon has this format: Main[ Polygon[Array[ Point[], Point[]... ], ...], ...]
            //console.log(feature.properties.height); // this is the building height
            //console.log(feature.properties.min_height); // this is the building part elevation from groung (e.g. a bridge)
        });
    }, 1000);

}

function formValidation(lat, long) {
    let val2 = parseFloat(long);
    let val1 = parseFloat(lat);
    if (!isNaN(val1) && val1 <= 90 && val1 >= -90 && !isNaN(val2) && val2 <= 180 && val2 >= -180)
        return true;
    else
        return false;
}

function getFormInput() {
    let long = document.getElementById("longitude").value;
    let lat = document.getElementById("latitude").value;
    if (formValidation(lat, long)) {
        setMap(long, lat);
        init();
        document.getElementById("formMessage").innerHTML = "Enter coordinates: ";
        showForm(true);
    } else {
        let str = "Enter valid coordinates: ";
        document.getElementById("formMessage").innerHTML = str.fontcolor("red");
    }
}

function showForm(value) {
    document.getElementById("form").hidden = value;
    document.getElementById("showForm").hidden = !value;
}



function drawPointArray(object, array, fill = false, color = 0) {
    let line_x=getCoordinateX(array[0][0]);
    let line_y=getCoordinateY(array[0][1]);
    if (fill === true)
        object.graphics.moveTo(line_x, line_y).beginFill(color);
    else
        object.graphics.moveTo(line_x, line_y);
    array.forEach(function(point) {
        object.graphics.lineTo(getCoordinateX(point[0]), getCoordinateY(point[1]));
    });
}

function drawRoad(geometry, color) {
    let road = new createjs.Shape();
    road.graphics.beginStroke(color);

    if (geometry.type === "MultiLineString") {
        geometry.coordinates.forEach(function(array) {
            drawPointArray(road, array);
        });
    } else {
        drawPointArray(road, geometry.coordinates);
    }
    stage.addChild(road);
}

//TODO: rename to instantiate
function drawPolygon(geometry, fill = false, color) {
    let polygon = new createjs.Shape();
    polygon.graphics.beginStroke(color);

    if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(function(multiPolygon) {
            multiPolygon.forEach(function(figure) {
                drawPointArray(polygon, figure, fill, color);
            });
        });
    } else {
        geometry.coordinates.forEach(function(figure) {
            drawPointArray(polygon, figure, fill, color);
        });
    }
    stage.addChild(polygon);
}

function drawFeature(feature) {
    //TODO check if feature not already drawn
    //if feature.id in our array
    //return
    switch (feature.sourceLayer) {
        case "road": {
            drawRoad(feature.geometry, "gray");
            break;
        }
        case "building": {
            buildings.push(feature);
            drawPolygon(feature.geometry, false, "red");
            break;
        }
        case "water": {
            drawPolygon(feature.geometry, true, "blue");
            break;
        }
        default:
            break;
    }
}

function isPlayerCollidingWith(polygon2){

}

