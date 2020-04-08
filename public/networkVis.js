//Constants for the SVG
var width = 750,
   height = 500;

// Setup of the legend
var legendRectSize = 18;
var legendSpacing = 4;

//Set up the colour scale
var color = d3.scale.category20();

//Set up the force layout
var force = d3.layout.force()
  .charge(-120)
  .linkDistance(30)
  .size([width, height]);

//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("svg").append("svg:svg")
  .attr("width", "100%")
  .attr("height", "100%")

svg.append('svg:rect')
   .attr("width", width)
   .attr("height", height)
   .style("stroke", '#fff')
   .style("fill", '#fff');

//Set up tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
    return  d.name + "";
})
svg.call(tip);

//Read the data from the mis element
var mis = document.getElementById('mis').innerHTML;
graph = JSON.parse(mis);
graphRec=JSON.parse(JSON.stringify(graph));

//Creates the graph data structure out of the json data
force.nodes(graph.nodes)
  .links(graph.links)
  .start();

//Create all the line svgs but without locations yet
var link = svg.selectAll(".link")
  .data(graph.links)
  .enter().append("line")
  .attr("class", "link")
  .style("stroke-width", function(d) {
    return Math.sqrt(d.value);
  });

//Do the same with the circles for the nodes
var node = svg.selectAll(".node")
  .data(graph.nodes)
  .enter().append("circle")
  .attr("class", "node")
  .attr("r", 8)
  .style("fill", function(d) {
    return color(d.group);
  })
  .call(force.drag)
  .on('dblclick', connectedNodes)
  .on('mouseover', tip.show)
  .on('mouseout', tip.hide);


//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
var radius=8;

force.on("tick", function() {
  link.attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });


  node.attr("cx", function(d) {
      //return d.x = Math.max(radius, Math.min(width - radius, d.x));
      return d.x;
    })
    .attr("cy", function(d) {
      //return d.y = Math.max(radius, Math.min(height - radius, d.y));
      return d.y;
    });
    node.each(collide(0.5));
});

//adjust threshold
function threshold(thresh) {
    graph.links.splice(0, graph.links.length);
        for (var i = 0; i < graphRec.links.length; i++) {
            if (graphRec.links[i].value > thresh) {graph.links.push(graphRec.links[i]);}
        }
    restart();
}

//Restart the visualisation after any node and link changes
function restart() {
    link = link.data(graph.links);
    link.exit().remove();
    link.enter().insert("line", ".node").attr("class", "link");
    node = node.data(graph.nodes);
    node.enter().insert("circle", ".cursor").attr("class", "node").attr("r", 5).call(force.drag);
    force.start();
}

// Collision detection
var padding = 1, // separation between circles
radius=8;
function collide(alpha) {
  var quadtree = d3.geom.quadtree(graph.nodes);
  return function(d) {
    var rb = 2*radius + padding,
        nx1 = d.x - rb,
        nx2 = d.x + rb,
        ny1 = d.y - rb,
        ny2 = d.y + rb;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

//Toggle stores whether the highlighting is on
var toggle = 0;
//Create an array logging what is connected to what
var linkedByIndex = {};
for (i = 0; i < graph.nodes.length; i++) {
    linkedByIndex[i + "," + i] = 1;
};
graph.links.forEach(function (d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
});
//This function looks up whether a pair are neighbours
function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
}
function connectedNodes() {
    if (toggle == 0) {
        //Reduce the opacity of all but the neighbouring nodes
        d = d3.select(this).node().__data__;
        node.style("opacity", function (o) {
            return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
        });
        link.style("opacity", function (o) {
            return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
        });
        //Reduce the op
        toggle = 1;
    } else {
        //Put them back to opacity=1
        node.style("opacity", 1);
        link.style("opacity", 1);
        toggle = 0;
    }
}

// Setting up the legend
var legend = d3.select('svg')
    .append("g")
    .attr("width", '100%')
    .attr("height", '100%')
    .selectAll("g")
    .data(color.domain())
    .enter()
    .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var height = legendRectSize;
        var x = Math.min(width)-1;
        var y = i * Math.min(height) + 5;
        return 'translate(' + x + ',' + y + ')';
    });

legend.append('rect')
    .attr('width', legendRectSize)
    .attr('height', legendRectSize)
    .style('fill', color)
    .style('stroke', color);

legend.append('text')
    .attr('x', legendRectSize + legendSpacing)
    .attr('y', legendRectSize - legendSpacing)
    .text(function(d) { return d; });
