var Taxman = Object({
	onload: function() {
		var revenue = Graph("revenue_graph");
		revenue.setData([
			[0, 20],
			[20, 10],
			[30, 20],
			[101, 50]
		]);
		
		var tax = Graph("tax_graph");
		tax.setData([
			[1, 2],
			[3, 4],
			[100, 50]
		]);
	}
});

var Graph = function(id, color) {
	var o      = Object(_Graph);
	o.initialize(id, color);
	return o
}

var _Graph = Object({
	// An array of x, y coordinates
	data   : null,
	// Räphael-related stuff
	paper   : null,
	path    : null,
	sub     : null,
	buttons : null,
	blankets: null,
	
	/* Graph-related stuff
	 *	- Dimensions of the graph
	 *	- Colors to use for the graph
	 *	- Dimensions of the graph (in pixels)
	 */
	minx   : 0,
	maxx   : 100,
	miny   : 0,
	maxy   : 50,
	color  : "hsb(240°, 1, 1)",
	width  : 0,
	height : 0,
	
	/* Internal state stuff
	 */
	dragging : -1,
	start    : null,
	
	initialize : function(id, color) {
		// Find the associated HTML element,
		var el = $("#" + id);
		this.id     = id;
		// And determine its dimensions, initialize other bits
		this.width  = el.width();
		this.height = el.height();
		// Save some of the options
		// this.color  = color;
		// Create a paper object
		this.paper  = Raphael(id, this.width, this.height);
		
		// This is the path for the graph
		this.path   = this.paper.path().attr({
			"stroke"      : this.color,
			"stroke-width": 2
		});
		
		// I'm still not sure what to make of this one
		this.sub    = this.paper.path().attr({
			"stroke" : "none",
			"fill"   : [90, this.color, this.color].join("-"),
			"opacity": 0
		});
		
		// Not sure what to make of these, yet, either
		this.blankets = this.paper.set();
		this.buttons  = this.paper.set();
	}
	
	addPoint : function(x, y, redraw) {
		if (y == null) {
			this.data.push(x);
		} else {
			this.data.push([x, y]);
		}
		this.data.sort(function(a,b) { return b - a; });
		if (redraw) {
			this.draw();	
		}
	},
	
	removePoint : function(x, y, redraw) {
		var index = -1;
		if (y == null) {
			this.data.indexOf(x);
		} else {
			this.data.indexOf([x, y]);
		}
		
		if (index >= 0) {
			this.data.splice(index, 1);
		}
		
		if (redraw) {
			this.draw();
		}
	},
	
	blankets : function() {
		for (var i = 0; i < this.data.length; i++) {
			var datum = _Graph.pointToPixel(this.data[i]);
			this.buttons.push(r.circle(datum[0], datum[1], 5).attr({
				"fill"  : this.color,
				"stroke": "none"
			}));
			
			var blanket = r.circle(datum[0], datum[1], 2).attr({
				"stroke" : "none",
				"fill"   : "#fff",
				"opacity": 0
			});
			// Make a reference to this graph
			blanket.graph = this;
			blanket.drag(function(dx, dy) {
				this.graph.update()
				var start = this.start;
				start && 
			}, function(x, y) {
				// Save some starting information
				this.start = {
					index: i,
					px   : x,
					py   : y,
					sx   : datum[0],
					sy   : datum[1]
				}
			})
			
			this.blankets.push(blanket);
		}
		this.buttons.push(this.paper.circle)
		for (i = 0, ii = values.length - 1; i < ii; i++) {
            var xy = translate(i, values[i]),
                xy1 = translate(i + 1, values[i + 1]),
                f;
            X[i] = xy[0];
            Y[i] = xy[1];
            if (i == ii - 1) {
                f(i + 1, xy1);
            }
        }
        xy = translate(ii, values[ii]);
        X.push(xy[0]);
        Y.push(xy[1]);
	}
	
	setData : function(d) {
		this.data = d;
		this.data.sort(function(a,b) { return b - a; });
		this.draw();
	},
	
	pointToPixel : function(p) {
		// Convert a graph point to a pixel coordinate
		var nx = Math.round((p[0] - this.minx) * this.width  / (this.maxx - this.minx));
		var ny = Math.round((p[1] - this.miny) * this.height / (this.maxy - this.miny));
		ny = this.height - ny;
		return [nx, ny];
	},
	
	pixelToPoint : function(p) {
		// Convert a pixel coordinate to a point
		console.log(p);
		var nx = (p[0] / this.width) * (this.maxx - this.minx) + this.minx;
		var ny = this.height - p[1];
		ny = (ny / this.height) * (this.maxy - this.miny) + this.miny;
		return [nx, ny];
	},
	
	drawPath : function() {
        var p = [];
		for (var i = 1; i < this.data.length; i++) {
			var datum = _Graph.pointToPixel(this.data[i]);
			p.push(datum[0], datum[1]);
		}
		p = ["M", X[0], Y[0], "R"].concat(p);
		var subaddon = "L" + (W - 10) + "," + (H - 10) + ",50," + (H - 10) + "z";
		this.path.attr({path: p});
		this.sub.attr({path: p + subaddon});
	},
	
	draw : function(p) {
		// If a temporary point was provided, use it
		var tmpdata = Object(this.data);
		if (p != null) {
			tmpdata.push(p);
			console.log('Temporarily pushing on ' + p);
			tmpdata.sort(function(a,b) { return b - a; });
		}
		
		var strdata = [];
		for (var index = 0; index < tmpdata.length; index++) {
			var datum = this.pointToPixel(tmpdata[index]);
			
			strdata.push(datum[0] + "," + datum[1]);
			
			// Draw a circle at this point
			var circle = this.paper.circle(datum[0], datum[1], 7);
			circle.attr("fill", "#000");
			circle.attr("stroke", "#000");
			circle.drag(function(dx, dy, x, y, evt) {
				this.draw(this.pixelToPoint([x, y]));
			}, function(x, y, evt) {
				this.removePoint(this.pixelToPoint([x, y]));
			}, function(evt) {
				this.addPoint(this.pixelToPoint([evt.x, evt.y]));
				this.draw();
			}, this, this, this);
		}
		
		if (this.path != null) {
			this.path.clear();	
		}
		this.path = this.paper.path("M" + strdata.join("L"));
		this.path.attr("stroke", "#f00");
		this.path.attr("stroke-width", 2);
	}
});