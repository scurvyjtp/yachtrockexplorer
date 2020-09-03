//
// Global Vars
//
var margin = {
        top: 5,
        right: 5,
        bottom:5,
        left: 5},
    barwidth  = 200 - margin.left - margin.right,
    barheight = 400 - margin.top - margin.bottom,
    width  = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom,
    radius = 5;

// Tooltip div
var tdiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity",0);

//
// bar chart
//

var x = d3.scaleLinear().range([0,barwidth]);
var y = d3.scaleBand().range([0,barheight]).padding(0.1);

var barsvg = d3.select("#d3bar").append("svg")
    .attr("width",  barwidth  + margin.left + margin.right)
    .attr("height", barheight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("/get_bar").then(function(data) {
    console.log(data)

    data.forEach(function(d) {
            d.count = +d.count;
    });

    x.domain([0, d3.max(data, function(d) { return d.count; })]);
    y.domain(data.map(function(d) { return d.name; }));

    var bar = barsvg.selectAll("g")
        .data(data)
        .enter()
        .append("g")

    bar.append("rect")
        .attr("class", "bar")
        .attr("width", function(d) {return x(d.count); })
        .attr("height", y.bandwidth())
        .attr("y", function(d) { return y(d.name); });

    bar.append("text")
        .attr("class", "label")
        .attr("y", function(d) {return y(d.name) + 14; })
        .text(function(d) { return d.name })
        .attr("fill", "white");
});


// Circle styling //
function circleColor(d) {
    if(d.group == 'song') {
        return "red";
    } else {
        return "blue";
    }
}

function circleRadius(d) {
    if(d.group == 'song') {
        return radius * 2;
    } else {
        return radius;
    }
}

// Drag events //
function dragstarted(d) {
    if(!d3.event.active) sim.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if(!d3.event.active) sim.alphaTarget(0)
    d.fx = null;
    d.fy = null;
}

// Label Toggle
var labelStatus = 1;
d3.select("#label-toggle")
    .on("click", function() {
        if(labelStatus == 1) {
            newO = 0;
            labelStatus = 0;
        } else {
            newO = 1;
            labelStatus = 1;
        }
        d3.selectAll(".nodelabel").style("opacity",newO);
  });

// Redraw Button
d3.select("#redraw")
    .on("click", function() {
        name = document.getElementById("autosearch").value;
        degree = document.getElementById("degreeslider").value;
        url = "/get_by_name/" + name + "/" + degree
        redrawData(url)
    });

d3.select("#drawmap")
    .on("click", function() {
        map_source = document.getElementById("map_source").value;
        map_target = document.getElementById("map_target").value;
        url = "/get_direct_map/" + map_source+ "/" + map_target 
        redrawData(url)
        //alert(map_source + " " + map_target);
    });

var sim = d3.forceSimulation()
        //.force("collision", d3.forceCollide().radius(function(d) { return d.radius; }))
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody().strength(-5))
        .force("center", d3.forceCenter(width/2, height/2));


function redrawData(url) {
    console.log(url)

    //clear the div
    d3.select("#d3force").selectAll("*").remove();

    // initialize the div
    var gsvg = d3.select("#d3force").append("svg")
        .attr("width",  width )  //+ margin.left + margin.right)
        .attr("height", height ) //+ margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add a container for zoom and pan functionality
    var container = gsvg.append("g");

    // zoom
    gsvg.call(d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() {
            container.attr("transform", d3.event.transform);
        })
    );

    // populate the simulation based on the data
    //d3.json("/get_by_name").then(function(data) {
    d3.json(url).then(function(data) {
        console.log(data);

        var link = container.append("g")
            .attr("class","links")
            .selectAll("line")
            .data(data.links)
            .enter().append("line")
            .attr("stroke-width", 1);

        var node = container.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g");

        var labels =
            node.append("text")
                .text(function(d) { return d.id; })
                .attr("class", "nodelabel")
                .attr('x', 6)
                .attr('y', 3);

        var circles = node.append("circle")
            .attr("r", circleRadius)
            .attr("fill", circleColor)
            .attr("stroke", "black")
            .attr("stroke-width", "1.5px")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", function(d) {
                    tdiv.transition().duration(50)
                    .style("opacity", 1)
                    tdiv.html("<p>" + d.id + "</p")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tdiv.transition().duration(500)
                .style("opacity", 0);
            });

        node.append("title")
            .text(function(d) { return d.id; });

        sim.alphaTarget(0.3).restart();
        sim.nodes(data.nodes).on("tick",ticked);
        sim.force("link").links(data.links);

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            node
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
        }
    });
}

// initial load
document.addEventListener("DOMContentLoaded", function(event) {
    //redrawData('/get_network')
    redrawData('/get_by_name/Ray Parker Jr./1')
});
