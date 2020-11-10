Triangle
========

Javascript wrapper around [Triangle](https://www.cs.cmu.edu/~quake/triangle.html) - A Two-Dimensional Quality Mesh Generator and Delaunay Triangulator.

> Triangle generates exact Delaunay triangulations, constrained Delaunay triangulations, conforming Delaunay triangulations, Voronoi diagrams, and high-quality triangular meshes.  The latter can be generated with no small or large angles, and are thus suitable for finite element analysis.

[Triangle](https://www.cs.cmu.edu/~quake/triangle.html) was created at Carnegie Mellon University by Jonathan Shewchuk.

This is a Javascript wrapper around the original C library, compiled to WebAssembly using [Emscripten](https://emscripten.org/). The API was preserved, consisting of a single method `triangulate()` and an input/output object `triangulateio`. Other methods were added to bridge WASM and Javascript.

| Planar Straight Line Graph        | Delaunay triangulation             | Constrained Delaunay triangulation |
|---------------------------------- | ---------------------------------- | ---------------------------------- |
| ![PSLG][1]                        | ![DT][2]                           | ![CDT][3]                          |
| input                             | output                             | output `-p`                        |

| Quality mesh (minimum angle) | Conforming constrained Delaunay triangulation | Quality mesh (maximum area)  |
|---------------------------------- | ---------------------------------- | ---------------------------------- |
| ![PSLG][4]                        | ![min.angle][5]                    | ![max.area][6]                     |
| output `-pq`                      | output `-pqD`                      | output `-pqDa0.2`                  |

[1]: https://user-images.githubusercontent.com/880280/98299769-21ff0b80-1fb0-11eb-86f7-13982a371577.png
[2]: https://user-images.githubusercontent.com/880280/98300007-90dc6480-1fb0-11eb-8de7-c2bfa3478cfb.png
[3]: https://user-images.githubusercontent.com/880280/98300168-d00ab580-1fb0-11eb-888f-fad794355815.png
[4]: https://user-images.githubusercontent.com/880280/98301014-0b59b400-1fb2-11eb-83d5-410d61ef8d15.png
[5]: https://user-images.githubusercontent.com/880280/98301244-5c69a800-1fb2-11eb-8d81-589971039d68.png
[6]: https://user-images.githubusercontent.com/880280/98301667-0ba67f00-1fb3-11eb-8260-d1adb6297096.png

## Install
```
npm install triangle
```

## Example
```js
const Triangle = require('triangle');

const data = { pointlist: [-1, -1, 1, -1, 1, 1, -1, 1] };

Triangle.init().then(() => {
  const input = Triangle.makeIO(data);
  const output = Triangle.makeIO();
  
  Triangle.triangulate({ quality: true }, input, output);
  
  // draw output
  // ...
  
  Triangle.freeIO(input, true);
  Triangle.freeIO(output);
});
```

## Demo

- [Demo: Minimal](https://brunoimbrizi.github.io/triangle/demo/minimal)
- [Demo: Switches](https://brunoimbrizi.github.io/triangle/demo/switches)
- [Demo: Voronoi](https://brunoimbrizi.github.io/triangle/demo/voronoi)


## API

### `init(path)`
Initialises the WASM module.

- `path` (default `/`) path to `triangle.out.wasm`

**Returns** a `Promise` which resolves when the .wasm module is ready.


### `triangulate(switches, input, output, vorout = null)`
Triangulates the data passed in as `input` and writes the result to `ouput` (and the Voronoi result to `vorout`).

- `switches` an object or a string of switches
- `input` an instance of `TriangulateIO` - the input data
- `output` an instance of `TriangulateIO` - initialised, but empty
- `vorout` an instance of `TriangulateIO` - initialised, but empty (Optional)

**Returns** null

### `makeIO(data = null)`
Creates an instance of `TriangulateIO` and allocates memory on the heap. `data` is only required when creating an input instance.

- `data` input data i.e. from a parsed .poly or .svg

**Returns** an instance of [`TriangulateIO`](#triangulateio)

### `freeIO(io, all = false)`
Releases the allocated memory for an input/output instance.

- `io` reference to the stored i/o object
- `all` release all copied pointers

**Returns** null


## Switches

Switches can be either an object or a string.
```js
// i.e. the following calls are identical
Triangle.triangulate({ quality: true, convexHull: true }, input, output);
Triangle.triangulate('pzQqc', input, output);
```

| string | switch        | type                        | description  |
| ------ | ------------- | --------------------------- | ------------ |
| `-q`   | `quality`     | `boolean`<br>or<br>`number` | Quality mesh generation by Delaunay refinement.<br>Adds vertices to the mesh to ensure that all angles are between 20 and 140 degrees.<br>A minimum angle can be set by passing a `number`. Guaranteed to terminate for 28.6 degrees or smaller. Often succeeds up to 34 degrees. |
| `-a`   | `area`        | `boolean`<br>or<br>`number` | Imposes a maximum triangle area.<br>A maximum area can be set by passing a `number`.<br>If `true` reads maximum area from the input (i.e. a .poly file) |
| `-D`   | `ccdt`        | `boolean`                   | Conforming constrained Delaunay triangulation |
| `-r`   | `refine`      | `boolean`                   | Refines a previously generated mesh. |
| `-c`   | `convexHull`  | `boolean`                   | Creates segments on the convex hull of the triangulation.<br>Beware: if you are not careful, this switch can cause the introduction of an extremely thin angle between a PSLG segment and a convex hull segment, which can cause overrefinement (and possibly failure if Triangle runs out of precision). |
| `-j`   | `jettison`    | `boolean`                   | Prevents duplicated input vertices, or vertices 'eaten' by holes, from appearing in the output. If any vertices are jettisoned, the vertex numbering in the output differs from that of the input. |
| `-e`   | `edges`       | `boolean`                   | Outputs a list of edges of the triangulation. |
| `-n`   | `neighbors`   | `boolean`                   | Outputs a list of triangles neighboring each triangle. |
| `-o2`  | `quadratic`   | `boolean`                   | Generates second-order subparametric elements with six nodes each. |
| `-A`   | `regionAttr`  | `boolean`                   | Assigns an additional floating-point attribute to each triangle that identifies what segment-bounded region each triangle belongs to. |
| `-B`   | `bndMarkers`  | `boolean`                   | Output boundary markers. (default `true`)<br>Attention: `-B` works the other way around, if present it suppresses boundary markers. |
| `-O`   | `holes`       | `boolean`                   | Read holes from the input. (default `true`)<br>Attention: `-O` works the other way around, if present it ignores holes. |
| `-S`   | `steiner`     | `number`                    | Specifies the maximum number of Steiner points - vertices that are not in the input, but are added to meet the constraints on minimum angle and maximum area. (default unlimited) |
| `-Q`   | `quiet`       | `boolean`                   | Suppresses all explanation of what Triangle is doing, unless an error occurs. (default `true`) |
| `-p`   | _auto_        |                             | If `input` contains a list of segments it is read as a PSLG, otherwise as a list of points. (set automatically) |
| `-v`   | _auto_        |                             | If `vorout` is provided, outputs the Voronoi diagram associated with the triangulation. (set automatically) |
| `-z`   | _auto_        |                             | Zero based indices, always `true`. (set automatically) |

For a full list of switches, see [Command line switches](https://www.cs.cmu.edu/~quake/triangle.switch.html).

For more detailed descriptions of all the switches, see [Triangle's instructions](https://www.cs.cmu.edu/~quake/triangle.help.html).

The following are not part of the `switches` object, but can still be passed in as a string:
- `-u`, `-X`, `-Y`, `-V`

The following switches have no effect in the Javascript version of Triangle:
- `-g`, `-P`, `-N`, `-E`, `-I`, `-i`, `-F`, `-l`, `-s`, `-C`


Other examples of `switches` objects and their correspondent strings:
```js
// default
switches = null; // zQ

// if input is a PSLG (has points and segments)
switches = null; // pzQ

// quality mesh and conforming Delaunay
switches = { quality: true, ccdt: true }; // pzqDQ

// minimum angle, maximum area and output to console
switches = { quality: 20.5, area: 42.8, quiet: false }; // pzq20.5a42.8

// no boundary markers, no holes
switches = { bndMarkers: false, holes: false }; // pzQBO
```


## TriangulateIO

The `TriangulateIO` structure used to pass data into and out of the `triangulate()` procedure.

All the parameters are optional, except for `pointlist`. 
All the `numberof` parameters are set automatically.

| parameter                     | format                                          | description                    |
| ----------------------------- | ----------------------------------------------- | ------------------------------ |
| `pointlist`                   | 2 floats per point<br>`[x, y, x, y ...]`        | An array of point coordinates. |
| `pointattributelist`          | n floats per point                              | An array of point attributes.  |
| `pointmarkerlist`             | 1 int per point                                 | An array of point markers.     |
| `trianglelist`                | 3 ints per triangle<br>`[a, b, c, a, b, c ...]` | An array of triangle corners.  |
| `triangleattributelist`       | n floats per triangle                           | An array of triangle attributes. |
| `trianglearealist`            | 1 floats per triangle                           | An array of triangle area constraints.<br>Input only. |
| `neighborlist`                | 3 ints per triangle                             | An array of triangle neighbors.<br>Output only. |
| `segmentlist`                 | 2 ints per segment<br>`[p, q, p, q ...]`        | An array of segment endpoints. |
| `segmentmarkerlist`           | 1 int per segment                               | An array of segment markers.   |
| `holelist`                    | 2 floats per hole<br>`[x, y, x, y ...]`         | An array of holes.<br>Input only, copied to output. |
| `regionlist`                  | 4 floats per region<br>`[x, y, attr, area ...]` | An array of regional attributes and area constraints.<br>Input only, copied to output. |
| `edgelist`                    | 2 ints per edge<br>`[p, q, p, q ...]`           | An array of edge endpoints.<br>Output only. |
| `edgemarkerlist`              | 1 int per edge                                  | An array of edge markers.<br>Output only. |
| `normlist`                    | 2 floats per vector                             | An array of normal vectors, used for infinite rays in Voronoi diagrams.<br>Output only. |
| `numberofpoints`              | int (readonly)                                  | Number of points.              |
| `numberofpointattributes`     | int (readonly)                                  | Number of point attributes.    |
| `numberoftriangles`           | int (readonly)                                  | Number of triangles.           |
| `numberofcorners`             | int (readonly)                                  | Number of triangle corners.    |
| `numberoftriangleattributes`  | int (readonly)                                  | Number of triangle attributes. |
| `numberofsegments`            | int (readonly)                                  | Number of segments.            |
| `numberofholes`               | int (readonly)                                  | Number of holes. Input only, copied to output. |
| `numberofregions`             | int (readonly)                                  | Number of regions. Input only, copied to output. |
| `numberofedges`               | int (readonly)                                  | Number of edges. Output only.  |

## Releasing Memory

** **IMPORTANT** ** remember to destroy instances of `TriangulateIO` after using them to avoid memory leaks.

> While JavaScript is fairly forgiving in cleaning up after itself, static languages [such as C] are definitely not.<br>
> [Debugging memory leaks in WebAssembly using Emscripten](https://web.dev/webassembly-memory-debugging/)

When we call `makeIO()` we allocate memory ( _malloc_ ) and it needs to be released after with `freeIO()` ( _free_ ). To make matters even less convenient, Triangle copies pointers from input to output, so we need to be careful not to _double-free_. The solution is to call 'destroy all' `freeIO(io, true)` on one of the instances, either input or output.

```js
// allocate memory
const input = Triangle.makeIO(data);
const output = Triangle.makeIO();

Triangle.triangulate(null, input, output);

// use output
// ...

// release memory
Triangle.freeIO(input, true);
Triangle.freeIO(output);
```

## Voronoi Diagrams

This implementation does not use exact arithmetic to compute the Voronoi vertices, and does not check whether neighboring vertices are identical.

The result is a valid Voronoi diagram only if Triangle's output is a true Delaunay triangulation with no holes. The Voronoi output is usually meaningless (and may contain crossing edges and other pathology) if the output is a constrained Delaunay triangulation (CDT) or a conforming constrained Delaunay triangulation (CCDT), or if it has holes or concavities.

## See Also

- [Triangle](https://www.cs.cmu.edu/~quake/triangle.html) - A Two-Dimensional Quality Mesh Generator and Delaunay Triangulator
- [poly-parse](https://github.com/brunoimbrizi/poly-parse) - A parser for .poly and .node files used by Triangle.
- [svg-to-poly](https://github.com/brunoimbrizi/svg-to-poly) - Extracts a PSLG from .svg paths and prepares it for Triangle.

## License

MIT, see [LICENSE](LICENSE) for details.
