

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
  zoom: 5,
  layers: [light,layers.quakes],   // set initial map tile layer 
});




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
  '#e5f5e0', // lightest
  '#fee6ce',
  '#FF8C00',
  '#FF6347',
  '#FF4500',
  '#FF0000', // red (more intense earthquake magnitude)
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

// Realtime Data collected from USGA, all earthquaked registered in the last week 
var usgs_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

d3.json(usgs_url, function(response){
  var quakes = response.features;
  console.log(quakes);

  


  // geoJSON data provided as feature list of earthquake information 
  for (var i = 0; i < quakes.length; i++) 
  {
    // decode the geoJSON data 
    var location = quakes[i].geometry.coordinates;
    var magnitud = quakes[i].properties.mag;
    var place = quakes[i].properties.place;
    var intensity = magnitud*10000;
    // validity check
    if (location) {  
      var circle = L.circle([location[1], location[0]], {
        color: '#bdbdbd',
        fillColor: setColor(magnitud),
        fillOpacity: 0.75,
        radius: intensity
      });

      circle.addTo(layers.quakes);
      circle.bindPopup(place +" mag "+magnitud);
    }
  }
});



// Setting up the legend
var legend = L.control({ position: "bottomright" });
legend.onAdd = function() {
  var div = L.DomUtil.create("div", "info legend");
  var limits = ["0-1","1-2","3-4","4-5","5+"];
  var colors = magnitude_color;
  var labels = [];

  // Add min & max
  var legendInfo = "<h1>Magnitude</h1>" +
    "<div class=\"labels\">" +
      "<div class=\"min\">" + limits[0] + "</div>" +
      "<div class=\"max\">" + limits[4] + "</div>" +
    "</div>";

  div.innerHTML = legendInfo;

  limits.forEach(function(limit, index) {
    labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
  });

  div.innerHTML += "<ul>" + labels.join("") + "</ul>";
  return div;
};

// Adding legend to the map
legend.addTo(myMap);
