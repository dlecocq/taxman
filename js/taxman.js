var Taxman = Object({
	revenue : null,
	tax     : null,
	
	onload  : function() {
		this.revenue = Graph("revenue_graph", {
			'min'       : [1, 0],
			'max'       : [10000, 1400000],
			'transforms': [Math.log, null]
		});
		
		var points = Points(this.revenue, {
			'dots'     : false,
			'color'    : '#00f',
			'draggable': false
		});
		points.setData(IRS.income);
		this.revenue.addSeries('income', points);
		
		// points = Points(this.revenue, {
		// 	'dots'     : false,
		// 	'color'    : '#f00',
		// 	'draggable': false
		// });
		// points.setData(IRS.eval(IRS.rates));
		// this.revenue.addSeries('revenue', points);
		
		// points = Points(this.revenue, '#f00');
		// points.setData([
		// 	[0, 50],
		// 	[20, 20],
		// 	[50, 10],
		// 	[100, 20]
		// ]);
		// this.revenue.addSeries('revenue', points)		
	}
});

var Points = function(graph, options) {
	return Object({
		data     : [],
		path     : null,
		color    : null,
		graph    : null,
		paper    : null,
		buttons  : [],
		draggable: true,
		transform: [null, null],
	
		initialize : function(graph, options) {
			this.graph = graph;
			this.paper = this.graph.paper;
			
			this.color     = options['color'] || '#00f';
			if (options['draggable'] != null) {
				this.draggable = options['draggable'];
			}
			
			// This is the path for the graph
			this.path   = this.paper.path().attr({
				"stroke"      : this.color,
				"stroke-width": 2
			});
		
			// This does the fill for the bottom
			this.sub    = this.paper.path().attr({
				"stroke" : "none",
				"fill"   : this.color,
				"opacity": 0.4
			});
			
			return this;
		},
	
		addPoint : function(x, y) {
			if (y == null) {
				this.data.push(x);
			} else {
				this.data.push([x, y]);
			}
			this.data.sort(function(a,b) { return b - a; });
			this.draw();
		},
	
		removePoint : function(x, y) {
			var index = -1;
			if (y == null) {
				index = this.data.indexOf(x);
			} else {
				index = this.data.indexOf([x, y]);
			}
		
			if (index >= 0) {
				this.data.splice(index, 1);
			}
		},
	
		makeButton : function(index, x, y, draggable) {
			var datum = this.graph.pointToPixel([x, y]);
			var button = this.paper.circle(datum[0], datum[1], 5).attr({
				"fill"  : "r(0.5, 0.5)" + this.color + "-#005",
				"stroke": "none"
			});

			// Make a reference to this graph
			button.graph = this;
			button.index = index;
			if (this.draggable) {
				button.drag(function(dx, dy, x, y) {
					this.graph.update(this.index, x, y);
				});
			}

			this.buttons.push(button);
		},
	
		makeButtons : function() {
			for (var index = 0; index < this.data.length; index++) {
				var datum = this.graph.transform(this.data[index]);
				if (this.dots) {
					this.makeButton(index, datum[0], datum[1], true);	
				}
			}
		},
	
		setData : function(d) {
			this.data = d.slice(0);
			this.path = this.paper.path();
			this.makeButtons();
			this.draw();
		},
	
		update: function(index, nx, ny) {
			nx -= this.graph.position[0];
			ny -= this.graph.position[1];
			this.data[index] = this.graph.pixelToPoint([nx, ny]);
			this.draw();
			this.buttons[index].attr({
				cx: nx,
				cy: ny
			});
		},
	
		draw: function() {
			var datum = this.graph.pointToPixel(this.data[0]);
	        var p = ["M", datum[0], datum[1], "R"];
			for (var i = 1; i < this.data.length; i++) {
				datum = this.graph.pointToPixel(this.data[i]);
				p.push(datum[0], datum[1]);
			}
			
			this.path.attr({path: p});
			
			// Now let's make a closed shape for the bottom skirt
			var subaddon = "L" + this.graph.size[0] + "," + this.graph.size[1] + ",0," + this.graph.size[1] + "z";
			this.sub.attr({path: p + subaddon});
		}
	}).initialize(graph, options);
}

var Graph = function(id, options) {
	return Object({
		// The id of the element we're using
		id      : null,
		// An array of x, y coordinates
		data    : {},
		// Räphael-related stuff
		paper   : null,
	
		/* Graph-related stuff
		 *	- Dimensions of the graph
		 *	- Colors to use for the graph
		 *	- Dimensions of the graph (in pixels)
		 */
		limits   : {
			'min': [  0,   0],
			'max': [100, 100]
		},
		position : [0, 0],
		size     : [0, 0],
	
		initialize : function(id, options) {
			// Find the associated HTML element,
			var el = $("#" + id);
			this.id       = id;
			// And determine its dimensions, initialize other bits
			this.size     = [el.width(), el.height()];
			this.position = [el.offset().left, el.offset().top];
			// Create a paper object
			this.paper  = Raphael(id, this.width, this.height);
			
			// Limits
			this.limits['min'] = options['min'] || [  0,   0];
			this.limits['max'] = options['max'] || [100, 100];
			
			// Transforms
			this.transforms = options['transforms'] || [null, null];
			this.limits['min'] = this.transform(this.limits['min']);
			this.limits['max'] = this.transform(this.limits['max']);
			
			return this;
		},
	
		removeSeries : function(name) {
			return delete this.data[name];
		},
	
		addSeries : function(name, points) {
			this.data[name] = points;
		},
	
		getSeries : function(name) {
			return this.data[name];
		},
		
		transform: function(p) {
			var result = p;
			if (this.transforms[0]) {
				result[0] = this.transforms[0](result[0]);
			}
			
			if (this.transforms[1]) {
				result[1] = this.trasnforms[1](result[1]);
			}
			return result;
		},
	
		pointToPixel : function(p) {
			// Convert a graph point to a pixel coordinate
			var minx = this.limits['min'][0];
			var miny = this.limits['min'][1];
			var maxx = this.limits['max'][0];
			var maxy = this.limits['max'][1];
		
			var nx = Math.round((p[0] - minx) * this.size[0] / (maxx - minx));
			var ny = Math.round((p[1] - miny) * this.size[1] / (maxy - miny));
			ny = this.size[1] - ny;
			return [nx, ny];
		},
	
		pixelToPoint : function(p) {
			// Convert a pixel coordinate to a point
			var minx = this.limits['min'][0];
			var miny = this.limits['min'][1];
			var maxx = this.limits['max'][0];
			var maxy = this.limits['max'][1];
		
			var nx = (p[0] / this.size[0]) * (maxx - minx) + minx;
			var ny = this.size[1] - p[1];
			ny = (ny / this.size[1]) * (maxy - miny) + miny;
			return [nx, ny];
		}
	}).initialize(id, options);
}