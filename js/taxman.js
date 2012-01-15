var Taxman = Object({
	revenue : null,
	tax     : null,
	// All values are in millions of dollars
	budget  : {
		'defense' : {
			'supplies': 1000,
			'payroll' : 500,
		},
		'science' : {
			'nasa'    : 19,
			'research': 200,
		},
		'education': {
			'teachers': 2,
			'pooping' : 50
		}
	},
	
	printbudget: function() {
		for (var department_name in this.budget) {
			console.log(department);
			var total = 0;
			var department = this.budget[department_name];
			for (var division_name in department) {
				var value = department[division_name];
				console.log('We spend $' + value + 'M on ' + division_name);
			}
		}
	},
	
	onload  : function() {
		this.revenue = Graph("revenue_graph");
		this.revenue.setData([
			[0, 20],
			[20, 10],
			[50, 20],
			[100, 50]
		]);
		
		// this.tax = Graph("tax_graph");
		// this.tax.setData([
		// 	[1, 2],
		// 	[3, 4],
		// 	[100, 50]
		// ]);
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
		
		console.log('initialize');
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
	},
	
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
	
	makeBlankets : function() {
		for (var i = 0; i < this.data.length; i++) {
			var datum = _Graph.pointToPixel(this.data[i]);
			this.buttons.push(this.paper.circle(datum[0], datum[1], 5).attr({
				"fill"  : this.color,
				"stroke": "none"
			}));
			
			var blanket = this.paper.circle(datum[0], datum[1], 2).attr({
				"stroke" : "none",
				"fill"   : "#fff",
				"opacity": 0
			});
			// Make a reference to this graph
			blanket.graph = this;
			blanket.drag(function(dx, dy) {
				this.graph.update();
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
	},
	
	setData : function(d) {
		this.data = d;
		this.data.sort(function(a,b) { return b - a; });
		this.path = this.paper.path();
		this.drawPath();
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
		var datum = _Graph.pointToPixel(this.data[0]);
		p = ["M", datum[0], datum[1], "R"].concat(p);
		var subaddon = "L" + (this.width - 10) + "," + (this.height - 10) + ",50," + (this.height - 10) + "z";
		this.path.attr({path: p});
		this.sub.attr({path: p + subaddon});
		this.makeBlankets();
	}
});