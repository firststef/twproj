var stage, isRunning;
var playerPos=[27.598505,47.162098];
var ZOOM = 60000;
var offsetx = 160;
var offsety = 90;
isRunning = false;

function init() {
    stage = new createjs.Stage("gameCanvas");
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    stage.update();
    stage.scaleX = 4;
    stage.scaleY = 4;

    var data = {
        images: ["./../sprites/spritesheet_grant.png"],
        frames: {width:165, height:292},
        animations: {
            idle:0,
            "run": [0, 25, "run", 1.5],
            "jump": [26, 63, "run"]
        },
        framerate: 30
    };
    var spriteSheet = new createjs.SpriteSheet(data);
    var sprite = new createjs.Sprite(spriteSheet, "idle");
    sprite.name = "player";
    stage.addChild(sprite);

    createjs.Ticker.on("tick", tick);
}

function tick(event) {
    stage.getChildByName("player").setTransform(130, 30, 0.2, 0.2);
    if (isRunning) {
        if (stage.getChildByName("player").currentAnimation !== "run")
            stage.getChildByName("player").gotoAndPlay("run");
    }
    else{
        if (stage.getChildByName("player").currentAnimation !== "idle")
            stage.getChildByName("player").gotoAndPlay("idle");
    }

    if (stage.getChildByName("playerdot") != null) {
        stage.getChildByName("playerdot").setTransform(-(playerPos[0] - map.transform._center.lng) * ZOOM + offsetx, (playerPos[1] - map.transform._center.lat) * ZOOM + offsety);
    }

    stage.update(event); // important!!
}

mapboxgl.accessToken = 'pk.eyJ1IjoiZmlyc3RzdGVmIiwiYSI6ImNrNzRneHkzbTBpaDQzZnBkZDY3dXRjaDQifQ.g6l-GFeBB2cUisg6MqweaA';


// pixels the map pans when the up or down arrow is clicked
const deltaDistance = 500;

// degrees the map rotates when the left or right arrow is clicked
const deltaDegrees = 25;

function easing(t) {
    return t * (2 - t);
}



var mySource;
var map ;
function setMap(lat=27.598505, long=47.162098){
    playerPos[0]=lat;
    playerPos[1]=long;
    map =new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [playerPos[0],playerPos[1]],
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
                        'features': [
                            {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': [0, 0]
                                }
                            }
                        ]
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


    setInterval( function(){

        var features = map.queryRenderedFeatures(
            {/*sourceLayer: ["road", "building"]*/}); // This is where I get building

        features.forEach(function(feature){
            //console.log(feature.geometry);  // feature.geometry getter returns building shape points (basement)
            //console.log(feature);

            console.log(feature.id);

            if (feature["id"] ==  229536321)
            {
                console.log('hai');
                console.log(feature);
            }

            if (feature.sourceLayer == "road" || feature["source-layer"] == "road") {

                let polygon = new createjs.Shape();
                polygon.graphics.beginStroke("blue");

                polygon.graphics.moveTo(-(playerPos[0]-feature.geometry.coordinates[0][0])*ZOOM + offsetx, (playerPos[1]-feature.geometry.coordinates[0][1])*ZOOM+ offsety);

                //console.log(-(playerPos[0]-feature.geometry.coordinates[0][0])*ZOOM+ offsetx, (playerPos[1]-feature.geometry.coordinates[0][1])*ZOOM+ offsety);

                feature.geometry.coordinates.forEach(function (point) {
                    polygon.graphics.lineTo(-(playerPos[0]-point[0])*ZOOM+ offsetx, (playerPos[1]-point[1])*ZOOM+ offsety);
                });

                stage.addChild(polygon);
            }
            else if (feature.sourceLayer == "building"){
                let polygon = new createjs.Shape();
                polygon.graphics.beginStroke("red");

                feature.geometry.coordinates.forEach(function (building){
                    let buildingx=-(playerPos[0] - building[0][0]) * ZOOM + offsetx;
                    let buildingy = (playerPos[1] - building[0][1]) * ZOOM + offsety;
                    polygon.graphics.moveTo(buildingx, buildingy);
                    building.forEach(function (point) {
                        polygon.graphics.lineTo(-(playerPos[0]-point[0])*ZOOM+ offsetx, (playerPos[1]-point[1])*ZOOM+ offsety);
                    });
                });

                stage.addChild(polygon);
            }


            var g = new createjs.Graphics();
            g.setStrokeStyle(1);
            g.beginStroke(createjs.Graphics.getRGB(0,0,0));
            g.beginFill(createjs.Graphics.getRGB(0,255,0));
            g.drawCircle(0,0,3);

            var s = new createjs.Shape(g);
            s.x = 5000;
            s.y = 10000;
            s.name = "playerdot";

            stage.addChild(s);



            //console.log(feature.properties.height); // this is the building height
            //console.log(feature.properties.min_height); // this is the building part elevation from groung (e.g. a bridge)
        });
    }, 1000);

}