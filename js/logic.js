

// Define variables for our tile layers
var light = L.tileLayer(
  'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?' +
    'access_token=pk.eyJ1IjoiZ3Vpcmx5biIsImEiOiJjamh0dzZnaHowaTlnM3BvNGl3NzYwNDQ2In0.fjmZrTxDywSwzCeE6BYKUg',
);
var dark = L.tileLayer(
  'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?' +
    'access_token=pk.eyJ1IjoiZ3Vpcmx5biIsImEiOiJjamh0dzZnaHowaTlnM3BvNGl3NzYwNDQ2In0.fjmZrTxDywSwzCeE6BYKUg',
);

// Only one base layer can be shown at a time
var baseMaps = {
  Light: light,
  Dark: dark,
};

// Place holder for the layers to be used
var layers = {
  quakes : new L.LayerGroup(),
  faults : new L.LayerGroup()
}

// Create map object and set default layers
var myMap = L.map('map', {
  center: [37.7749, -122.4194],
  zoom: 6,
  layers: [light, layers.quakes],   // set initial map tile layer 
});

var circles = [];
var earthquakeData = null;
var circlesLayer = null;

// Overlays that may be toggled on or off
var overlayMaps = {
  "Earthquakes": layers.quakes,
  "Fault Lines": layers.faults
};

// Pass our map layers into our layer control
// Add the layer control to the map
L.control.layers(baseMaps, overlayMaps).addTo(myMap);


// Define color scale for earthquake magnitude value
var magnitude_color = [
  '#ffffcc',// 0-1
  '#e5f5e0', // 1- 2
  '#fee6ce', // 2-3
  '#FF8C00', //3-4
  '#FF6347', //4-5
  '#FF0000', // 5+ red (more intense earthquake magnitude)
];

// given a magnitide return the approriate color from the magnitude range
function setColor(m){
  if (m<=1)
    return magnitude_color[0];
  if (m<=2)
    return magnitude_color[1];
  if (m<=3)
    return magnitude_color[2];
  if (m<=4)
    return magnitude_color[3];
  if (m<=5)
    return magnitude_color[4];
  // all 5+ magintude are same Red!!
  return magnitude_color[5];
  
}

//Get geo json data for tectonicplates

var plates_json = "tectonicplates/PB2002_boundaries.json";

//d3.json(plates_data, function(data){processes will be in here}).addTo(map);
d3.json(plates_json, function(data) {
    faults = new L.geoJson(data, {
      style: function(feature) {
        return {
          color: 'white',
          weight: 1.5,
        };
      },
      onEachFeature: function(feature, layer){
        layer.on({
          mouseover: function(event) {
            layer = event.target;
            layer.setStyle({
              fillOpacity:0.9,

            });
          },
          mouseout: function(event) {
            layer = event.target;
            layer.setStyle({
              fillOpacity: 0.5,
            });
          },
        });
      },
    }) 
    faults.addTo(layers.faults);
});

// Realtime Data collected from USGA, all earthquaked registered in the last week 
var usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

function circle_quakes(){
  d3.json(usgs_url, function(response){
    var quakes = response.features;
    earthquakeData = response.features;
    // geoJSON data provided as feature list of earthquake information 
    for (var i = 0; i < quakes.length; i++) 
    {
      // decode the geoJSON data 
      var location = quakes[i].geometry.coordinates;
      var magnitud = quakes[i].properties.mag;
      var place = quakes[i].properties.place;
      var when = new Date(quakes[i].properties.time);
      var intensity = magnitud*10000;
      
      // validity check
      if (location) {
        circles.push(  
            L.circle([location[1], location[0]], {
            color: '#bdbdbd',
            weight: 1,
            fillColor: setColor(magnitud),
            fillOpacity: 0.75,
            radius: intensity
          }).bindPopup("<h4>" + place +" <hr> magnitde: "+magnitud + " <hr> " + when + "</h4>"),
        )
      }
    }

    circlesLayer = L.layerGroup(circles);
    circlesLayer.addTo(layers.quakes);
  });
}



// Setting up the legend
var legend = L.control({ position: "bottomright" });
legend.onAdd = function() {
  var div = L.DomUtil.create("div", "info legend");
  var limits = ["0-1","1-2","2-3","3-4","4-5","5+"];
  var colors = magnitude_color;
  var labels = [];

  var legendInfo = "<h2>Magnitude</h2>" ;

  div.innerHTML = legendInfo;

  limits.forEach(function(limit, index) {
    labels.push("<li style=\"background-color: " + colors[index] + "\">           " + limits[index]+"</li>");
  });


  div.innerHTML += "<ul>" + labels.join("") + "</ul>";
  return div;
};

// Adding legend to the map
legend.addTo(myMap);

var myZoom = {
  start:  myMap.getZoom(),
  end: myMap.getZoom()
};

myMap.on('zoomstart', function(e) {
  //console.log("zoom start");
  myZoom.start = myMap.getZoom();
});

myMap.on('zoomend', function(e) {
   myZoom.end = myMap.getZoom();

  // redraw circle radius to fit the zoom level
   var diff = myZoom.start - myZoom.end;

   for (c = 0; c<circles.length; c++) {
    if (diff > 0) {
      // console.log("GOT A ZOOM difference of ", diff);
      //  For each circle in layers.quakes.setRadius(layers.quakes.getRadius() * 2);
      circles[c].setRadius(circles[c].getRadius()*2);
    } else if (diff < 0) {
        //console.log("GOT A ZOOM reset of ", diff);
        //console.log(c);
      //  For each circle in layers.quakes.setRadius(layers.quakes.getRadius() / 2);
      circles[c].setRadius(circles[c].getRadius()/2);
    }
  }
});

circle_quakes();

// var timelineLayer = L.timeline(earthquakeData, {
//   getInterval: function(feature) {
//       return {
//           start: feature.properties.time,
//           end: feature.properties.time + feature.properties.mag * 10000000
//       };
//   },
//   pointToLayer: layers.quakes,
//   //onEachFeature: onEachEarthquake
// });

// var timelineControl = L.timelineSliderControl({
//   formatOutput: function(date) {
//       return new Date(date).toString();
//   }
// });
// timelineControl.addTo(myMap);
// timelineControl.addTimelines(timelineLayer);
// timelineLayer.addTo(myMap);