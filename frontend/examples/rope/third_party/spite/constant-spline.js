// https://github.com/spite/THREE.ConstantSpline

var THREE = require('three');

THREE.ConstantSpline = function() {

	this.p0 = new THREE.Vector3();
	this.p1 = new THREE.Vector3();
	this.p2 = new THREE.Vector3();
	this.p3 = new THREE.Vector3();

	this.tmp = new THREE.Vector3();
	this.res = new THREE.Vector3();
	this.o = new THREE.Vector3();

	this.points = [];
	this.lPoints = [];
	this.steps = [];
	
	this.inc = .01;
	this.d = 0;

	this.distancesNeedUpdate = false;

};

THREE.ConstantSpline.prototype.calculate = function() {

	this.d = 0;
	this.points = [];

	this.o.copy( this.p0 );

	for( var j = 0; j <= 1; j += this.inc ) {
		
		var i = ( 1 - j );
		var ii = i * i;
		var iii = ii * i;
		var jj = j * j;
		var jjj = jj * j;
		
		this.res.set( 0, 0, 0 );
		
		this.tmp.copy( this.p0 );
		this.tmp.multiplyScalar( iii );		
		this.res.add( this.tmp );

		this.tmp.copy( this.p1 );
		this.tmp.multiplyScalar( 3 * j * ii );
		this.res.add( this.tmp );

		this.tmp.copy( this.p2 );
		this.tmp.multiplyScalar( 3 * jj * i );
		this.res.add( this.tmp );

		this.tmp.copy( this.p3 );
		this.tmp.multiplyScalar( jjj );
		this.res.add( this.tmp );

		this.points.push( this.res.clone() );
		
	}

	this.points.push( this.p3.clone() );

	this.distancesNeedUpdate = true;

};

THREE.ConstantSpline.prototype.calculateDistances = function() {

	this.steps = [];
	this.d = 0;

	var from, to, td = 0;

	for( var j = 0; j < this.points.length - 1; j++ ) {

		this.points[ j ].distance = td;
		this.points[ j ].ac = this.d;

		from = this.points[ j ],
		to = this.points[ j + 1 ],
		td = to.distanceTo( from );

		this.d += td;

	}

	this.points[ this.points.length - 1 ].distance = 0;
	this.points[ this.points.length - 1 ].ac = this.d;

}

THREE.ConstantSpline.prototype.reticulate = function( settings ) {

	if( this.distancesNeedUpdate ) {
		this.calculateDistances();
		this.distancesNeedUpdate = false;
	}

	var l = [];

	var steps, distancePerStep;

	if( settings.steps) {
		steps = settings.steps;
		distancePerStep = this.d / steps;
	}

	if( settings.distancePerStep ) {
		distancePerStep = settings.distancePerStep;
		steps = this.d / distancePerStep;		
	}

	var d = 0,
		p = 0;

	this.lPoints = [];

	var current = new THREE.Vector3();
	current.copy( this.points[ 0 ].clone() );
	this.lPoints.push( current.clone() );

	function splitSegment( a, b, l ) {

		var t = b.clone();
		var d = 0;
		t.sub( a );
		var rd = t.length();
		t.normalize();
		t.multiplyScalar( distancePerStep );
		var s = Math.floor( rd / distancePerStep );
		for( var j = 0; j < s; j++ ) {
			a.add( t );
			l.push( a.clone() );
			d += distancePerStep;
		}
		return d;
	}

	for( var j = 0; j < this.points.length; j++ ) {

		if( this.points[ j ].ac - d > distancePerStep ) {
			
			d += splitSegment( current, this.points[ j ], this.lPoints );

		}

	}
	this.lPoints.push( this.points[ this.points.length - 1 ].clone() );


};