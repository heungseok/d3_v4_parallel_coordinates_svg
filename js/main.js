
var margin = {top: 30, right: 10, bottom: 10, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;



var types = {
    "Number": {
        key: "Number",
        coerce: function(d) { return +d; },
        extent: d3.extent,
        within: function(d, extent, dim) {
            return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
        },
        defaultScale: d3.scaleLinear().range([0, height])
    },
    "String": {
        key: "String",
        coerce: String,
        extent: function (data) { return data.sort(); },
        within: function(d, extent, dim) {
            return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1];
            },
        defaultScale: d3.scalePoint().range([0, height])

    },
    "Date": {
        key: "Date",
        coerce: function(d) { return new Date(d); },
        extent: d3.extent,
        within: function(d, extent, dim) { return extent[0] <= dim.scale(d) && dim.scale(d) <= extent[1]; },
        defaultScale: d3.scaleTime().range([0, height])
    }
};

var dimensions = [
    {
        key: "modularity_class",
        description: "Network community",
        type: types["String"],
        scale: d3.scalePoint().range([height, 0])
    },
    {
        key: "eccentricity",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "closness_centrality",
        description: "Closness centrality",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "harmonic_closness_centrality",
        description: "Harmonic closness centrality",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "betweeness_centrality",
        description: "Betweeness centrality",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "eigen_centrality",
        description: "Eigenvector centrality",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "pageranks",
        description: "Pageranks",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "clustering_coefficient",
        dsecription: "Clustering coefficient",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    },
    {
        key: "triangles",
        description: "Triangles",
        type: types["Number"],
        scale: d3.scaleLinear().range([height, 0])
    }
];


var x_scale = d3.scalePoint()
        .domain(dimensions.map(function(dim) { return dim.key; }))
        .range([0, width]),
    y = {},
    dragging = {};

// var line = d3.line().curve(d3.curveBasis),
var line = d3.line(),
    y_axis = d3.axisLeft(),
    background,
    foreground;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// d3.csv("./data/cars.csv", function(error, data) {
d3.csv("./data/mooc_keyword_network.csv", function(error, data) {

    // pre-processing for each type of data
    data.forEach(function(d) {
        dimensions.forEach(function(p) {
            d[p.key] = !d[p.key] ? null : p.type.coerce(d[p.key]);
        });
        // truncate long text strings to fit in data table
        for (var key in d) {
            if (d[key] && d[key].length > 35) d[key] = d[key].slice(0,36);
        }
    });

    // type/dimension default setting happens here
    dimensions.forEach(function(dim) {
        if (!("domain" in dim)) {
            // detect domain using dimension type's extent function
            dim.domain = d3_functor(dim.type.extent)(data.map(function(d) { return d[dim.key]; }));

            // setting y's range of each dimension (axis)
            if(dim.type.key == types["Number"].key){
                y[dim.key] = d3.scaleLinear()
                    .domain(dim.domain)
                    .range([height, 0]);

            }else if(dim.type.key == types["String"].key){
                y[dim.key] = d3.scalePoint()
                    .domain(dim.domain)
                    .range([height, 0]);
            }
        }
        if (!("scale" in dim)) {
            // use type's default scale for dimension
            dim.scale = dim.type.defaultScale.copy();
        }

        // set domain to scale
        dim.scale.domain(dim.domain);
    });

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x_scale(d.key) + ")"; })
        .call(d3.drag()

            .on("start", function(d) {
                dragging[d.key] = x_scale(d.key);
                background.attr("visibility", "hidden");
            })
            .on("drag", function(d) {
                dragging[d.key] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function(a, b) { return position(a.key) - position(b.key); });
                x_scale.domain(dimensions.map(function(dim){return dim.key;}));
                g.attr("transform", function(d) { return "translate(" + position(d.key) + ")"; })
            })
            .on("end", function(d) {
                delete dragging[d.key];
                transition(d3.select(this)).attr("transform", "translate(" + x_scale(d.key) + ")");
                transition(foreground).attr("d", path);
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) {
            d3.select(this).call(y_axis.scale(y[d.key])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d.key; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d.key].brush = d3.brushY()
                .extent([[-10, 0], [10, height]])
                .on("start", brushstart)
                .on("brush", brush)
                .on("end", brush)
            )

            // d3.select(this).call(y[d].brush = d3.brush().extent([ [0,0], [1,y[d]] ]).on("start", brushstart).on("brush", brush));
            // d3.select(this).call(d3.brushY().on("start", brushstart).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);



    // Handles a brush event, toggling the display of foreground lines.
    function brush() {

        // get active brush objects
        var actives = [];
        d3.selectAll(".brush")
            .filter(function(d) {
                return d3.brushSelection(this);
            })
            .each(function(d) {
                actives.push({
                    dimension: d,
                    extent: d3.brushSelection(this)
                });
            });
        console.log("active dimensions");
        console.log(actives);

        foreground.style("display", function(d) {
            return actives.every(function(active) {
                var dim = active.dimension;
                // test if point is within extents for each active
                return dim.type.within(d[dim.key], active.extent, dim);
                // return extents[i][0] <= d[p.dimension] && d[p.dimension] <= extents[i][1];
            }) ? null : "none";
        });


        var selected = data.filter(function(d) {
            if (actives.every(function(active) {
                    var dim = active.dimension;
                    // test if point is within extents for each active brush
                    return dim.type.within(d[dim.key], active.extent, dim);
                })) {
                return true;
            }
        });

        // selected가 활성화된 pc-lines.
        console.log(selected)

    }



});

function position(d) {
    var v = dragging[d];
    return v == null ? x_scale(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
    return line(dimensions.map(function(p) {
        return [position(p.key), y[p.key](d[p.key])]; }));
}

function brushstart() {
    d3.event.sourceEvent.stopPropagation();
}


function d3_functor(v) {
    return typeof v === "function" ? v : function() { return v; };
};
