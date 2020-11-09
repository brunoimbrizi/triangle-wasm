const createModule = require('./triangle.out');

let Module = {};

// ---------------------------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------------------------

const stringToHeap = (str) => {
	const length = Module.lengthBytesUTF8(str) + 1;
	const ptr = Module._malloc(length);
	// copy js string to heap
	Module.stringToUTF8(str, ptr, length);

	return ptr;
};

const arrayToHeap = (arr, type = Int32Array) => {
	if (!arr || !arr.length) return null;

	const typedArray = getTypedArray(arr, type);
	const ptr = Module._malloc(typedArray.length * typedArray.BYTES_PER_ELEMENT);
	const pos = ptr / typedArray.BYTES_PER_ELEMENT;
	const heap = getHeapStr(type);

	const heapArray = Module[heap].subarray(pos, pos + typedArray.length);
	heapArray.set(typedArray);

	return ptr;
};

const heapToArray = (ptr, length, type = Int32Array) => {
	if (!ptr) return null;

	const pos = ptr / type.BYTES_PER_ELEMENT;
	const heap = getHeapStr(type);

  return Module[heap].subarray(pos, pos + length);
};

const getHeapStr = (type) => {
	switch (type) {
		case Float64Array:  
			return 'HEAPF64';
		case Int32Array: 
			return 'HEAP32';
		default:
			return 'HEAP8';
	}
};

const getTypedArray = (arr, type) => {
	if (arr.constructor == type) return arr;
	return new type(arr);
};

const getSwitchesStr = (obj, input, vorout = null) => {
	if (typeof obj === 'string') return obj;
	if (typeof obj !== 'object' || !obj) obj = {};

	let str = '';

	// is PSLG if there are segments or holes
	if (input.numberofsegments || input.numberofholes) {
		str = `${str}p`;
	}
	// is Voronoi
	if (vorout !== null) str = `${str}v`;
	// zero-based by default
	str = `${str}z`;
	// quiet by default
	if (obj.quiet				!== false) 	str = `${str}Q`;

	if (obj.refine 			=== true) 	str = `${str}r`;
	if (obj.regionAttr 	=== true) 	str = `${str}A`;
	if (obj.convexHull 	=== true) 	str = `${str}c`;
	if (obj.ccdt 				=== true) 	str = `${str}D`;
	if (obj.jettison		=== true) 	str = `${str}j`;
	if (obj.edges				=== true) 	str = `${str}e`;
	if (obj.neighbors		=== true) 	str = `${str}n`;
	if (obj.quadratic		=== true) 	str = `${str}o2`;
	if (obj.bndMarkers	=== false) 	str = `${str}B`;
	if (obj.holes				=== false) 	str = `${str}O`;

	if (typeof obj.steiner === 'number') 	str = `${str}S${obj.steiner}`;

	if (typeof obj.quality === 'number') 	str = `${str}q${obj.quality}`;
	else if (obj.quality === true) 				str = `${str}q`;

	if (typeof obj.area === 'number') 		str = `${str}a${obj.area}`;
	else if (obj.area === true) 					str = `${str}a`;

	// log switches if !quiet
	if (obj.quiet === false) console.log('Switches:', str);

	return str;
};


// ---------------------------------------------------------------------------------------------
// TRIANGULATE IO
// ---------------------------------------------------------------------------------------------

class TriangulateIO {

	static get LENGTH() { return 23; }

	constructor(props = {}) {

		this.ptr = Module._malloc(TriangulateIO.LENGTH * Int32Array.BYTES_PER_ELEMENT);
		this.arr = heapToArray(this.ptr, TriangulateIO.LENGTH);
		this.arr.set(new Int32Array(TriangulateIO.LENGTH));

		// assign props
		for (const prop in props) {
			if (prop in this) this[prop] = props[prop];
		}
	}

	destroy(all) {
		Module._free(this.arr[0]);
		Module._free(this.arr[1]);
		Module._free(this.arr[2]);
		Module._free(this.arr[5]);
		Module._free(this.arr[6]);
		Module._free(this.arr[7]);
		Module._free(this.arr[8]);
		Module._free(this.arr[12]);
		Module._free(this.arr[13]);
		Module._free(this.arr[19]);
		Module._free(this.arr[20]);
		Module._free(this.arr[21]);
		Module._free(this.ptr);

		// holelist and regionlist's pointers are copied from in to out
		// and should be freed only once - to avoid the double-free leak
		if (all) {
			Module._free(this.arr[15]);
			Module._free(this.arr[17]);
		}
	}

  // --------------------------------------------
  // SETTERS
  // --------------------------------------------

	set pointlist(value) {
		this.arr[0] = arrayToHeap(value, Float64Array);
		// numberofpoints
		this.arr[3] = value ? ~~(value.length * 0.5) : 0;
	}

	set pointattributelist(value) {
		this.arr[1] = arrayToHeap(value, Float64Array);
		// numberofpointattributes
		this.arr[4] = value ? ~~(value.length / this.numberofpoints) : 0;
	}

	set pointmarkerlist(value) {
		this.arr[2] = arrayToHeap(value);
	}

	set numberofpoints(value) {
		// set by pointlist
	}

	set numberofpointattributes(value) {
		// set by pointattributelist
	}

	set trianglelist(value) {
		this.arr[5] = arrayToHeap(value);
		// numberoftriangles
		this.arr[9] = value ? ~~(value.length / 3) : 0;
	}

	set triangleattributelist(value) {
		this.arr[6] = arrayToHeap(value, Float64Array);
		// numberoftriangleattributes
		this.arr[11] = value ? ~~(value.length / this.numberoftriangles) : 0;
	}

	set trianglearealist(value) {
		this.arr[7] = arrayToHeap(value, Float64Array);
	}

	set neighborlist(value) {
		this.arr[8] = arrayToHeap(value);
	}

	set numberoftriangles(value) {
		// set by trianglelist
	}

	set numberofcorners(value) {
		// set by triangulate()
	}

	set numberoftriangleattributes(value) {
		// set by triangleattributelist
	}

	set segmentlist(value) {
		this.arr[12] = arrayToHeap(value);
		// numberofsegments
		this.arr[14] = value ? ~~(value.length * 0.5) : 0;
	}

	set segmentmarkerlist(value) {
		this.arr[13] = arrayToHeap(value);
	}

	set numberofsegments(value) {
		// set by segmentlist
	}

	set holelist(value) {
		this.arr[15] = arrayToHeap(value, Float64Array);
		// numberofholes
		this.arr[16] = value ? ~~(value.length * 0.5) : 0;
	}

	set numberofholes(value) {
		// set by holelist
	}

	set regionlist(value) {
		this.arr[17] = arrayToHeap(value, Float64Array);
		// numberofregions
		this.arr[18] = value ? ~~(value.length * 0.25) : 0;
	}

	set numberofregions(value) {
		// set by regionlist
	}

	set edgelist(value) {
		this.arr[19] = arrayToHeap(value);
		// numberofedges
		this.arr[22] = value ? ~~(value.length * 0.5) : 0;
	}

	set edgemarkerlist(value) {
		this.arr[20] = arrayToHeap(value);
	}

	set normlist(value) {
		this.arr[21] = arrayToHeap(value, Float64Array);
	}

	set numberofedges(value) {
		// set by edgelist
	}



  // --------------------------------------------
  // GETTERS
  // --------------------------------------------

	get pointlist() {
		return heapToArray(this.arr[0], this.numberofpoints * 2, Float64Array);
	}

	get pointattributelist() {
		return heapToArray(this.arr[1], this.numberofpointattributes * this.numberofpoints, Float64Array);
	}

	get pointmarkerlist() {
		return heapToArray(this.arr[2], this.numberofpoints);
	}

	get numberofpoints() {
		return this.arr[3];
	}

	get numberofpointattributes() {
		return this.arr[4];
	}

	get trianglelist() {
		return heapToArray(this.arr[5], this.numberoftriangles * 3);
	}

	get triangleattributelist() {
		return heapToArray(this.arr[6], this.numberoftriangleattributes * this.numberoftriangles, Float64Array);
	}

	get trianglearealist() {
		return heapToArray(this.arr[7], this.numberoftriangles, Float64Array);
	}

	get neighborlist() {
		return heapToArray(this.arr[8], this.numberoftriangles * 3);
	}

	get numberoftriangles() {
		return this.arr[9];
	}

	get numberofcorners() {
		return this.arr[10];
	}

	get numberoftriangleattributes() {
		return this.arr[11];
	}

	get segmentlist() {
		return heapToArray(this.arr[12], this.numberofsegments * 2);
	}

	get segmentmarkerlist() {
		return heapToArray(this.arr[13], this.numberofsegments);
	}

	get numberofsegments() {
		return this.arr[14];
	}

	get holelist() {
		return heapToArray(this.arr[15], this.numberofholes * 2, Float64Array);
	}

	get numberofholes() {
		return this.arr[16];
	}

	get regionlist() {
		return heapToArray(this.arr[17], this.numberofregions * 4, Float64Array);
	}

	get numberofregions() {
		return this.arr[18];
	}

	get edgelist() {
		return heapToArray(this.arr[19], this.numberofedges * 2);
	}

	get edgemarkerlist() {
		return heapToArray(this.arr[20], this.numberofedges);
	}

	get normlist() {
		return heapToArray(this.arr[21], this.numberofedges * 2, Float64Array);
	}

	get numberofedges() {
		return this.arr[22];
	}
}

// ---------------------------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------------------------

const init = (path) => {
	return new Promise((resolve, reject) => {
		createModule({
			locateFile: (_f, _p) => path || _p + _f,
		})
		.then(m => {
			Module = m;
			resolve();
		})
	});
};

const triangulate = (switches, input, output, vorout = null) => {
	const s_str = getSwitchesStr(switches, input, vorout);
	const s_ptr = stringToHeap(s_str);
	const v_ptr = vorout ? vorout.ptr : null;

	Module._triangulate(s_ptr, input.ptr, output.ptr, v_ptr);

	Module._free(s_ptr);
};

const makeIO = (data) => {
	return new TriangulateIO(data);
};

const freeIO = (io, all) => {
	io.destroy(all);
};

module.exports = {
	init,
	triangulate,
	makeIO,
	freeIO,
	getSwitchesStr,
};
