const Triangle = require('../../');
const polyparse = require('poly-parse');
const svgToPoly = require('svg-to-poly');
const loadSvg = require('load-svg');
const unflat = require('array-unflat');
const Tweakpane = require('tweakpane');

// local vars
let input, output, update;

// init canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 640;
canvas.height = 640;

// util: flatten all arrays in an object
const flatten = (obj) => {
  for (key in obj) {
    if (Array.isArray(obj[key])) obj[key] = obj[key].flat();
  }
};

// util: multiply scalar an array of 2D points
const scale = (points, sx, sy) => {
	for (let i = 0; i < points.length; i++) {
		points[i][0] *= sx;
		points[i][1] *= sy;
	}
};

const load = (path) => {
  // svg
  if (path.includes('.svg')) {
    loadSvg(path, (err, svg) => {
      if (err) throw err;
      const data = svgToPoly(svg, { normalize: true });
      setup(data);
    });
  }
  // poly or node
  else {
    fetch(path)
    .then(result => result.text())
    .then(result => {
      const data = polyparse(result, { normalize: true, flipY: true });
      setup(data);
    });
  }
};

const setup = (data) => {
  // flatten all arrays
  flatten(data);

  // keep points only
  data.segmentlist = [];

  // release old input
  if (input) Triangle.freeIO(input);
  // store new input
  input = Triangle.makeIO(data);

  update();
};

const clear = () => {
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// draw onto canvas
const draw = (data, color = 'black', drawNorm = false) => {
  const points = unflat(data.pointlist);
  const triangles = unflat(data.trianglelist, 3);
  const edges = unflat(data.edgelist);
  const norm = unflat(data.normlist);

  // scale up to 80% of the canvas
  scale(points, canvas.width * 0.4, canvas.height * 0.4);

  ctx.save();
  ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.miterLimit = 5;
  
  // draw points
  let x, y;
  for (let i = 0; i < points.length; i++) {
    x = points[i][0];
    y = points[i][1];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw triangles
  if (triangles) {
    let a, b, c;
    for (var i = 0; i < triangles.length; i++) {
      // point indices
      a = triangles[i][0];
      b = triangles[i][1];
      c = triangles[i][2];

      ctx.beginPath();
      ctx.moveTo(points[a][0], points[a][1]);
      ctx.lineTo(points[b][0], points[b][1]);
      ctx.lineTo(points[c][0], points[c][1]);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // draw edges
  if (edges) {
    let a, b;
    for (let i = 0; i < edges.length; i++) {
      a = edges[i][0];
      b = edges[i][1];

      if (b === -1) continue;

      ctx.beginPath();
      ctx.moveTo(points[a][0], points[a][1]);
      ctx.lineTo(points[b][0], points[b][1]);
      ctx.stroke();
    }
  }

  // draw norm
  if (edges && norm && drawNorm) {
    let a, b, nx, ny, nlen;
    for (let i = 0; i < edges.length; i++) {
      a = edges[i][0];
      b = edges[i][1];

      if (b !== -1) continue;

      nx = norm[i][0];
      ny = norm[i][1];
      nlen = Math.sqrt(nx * nx + ny * ny);
      // normalise
      nx *= 1 / nlen;
      ny *= 1 / nlen;
      // scale up
      nx *= canvas.width;
      ny *= canvas.height;

      ctx.beginPath();
      ctx.moveTo(points[a][0], points[a][1]);
      ctx.lineTo(points[a][0] + nx, points[a][1] + ny);
      ctx.stroke();
    }
  }

  ctx.restore();
};


// parameters panel
const createPane = () => {
  let folder, squal, sarea;
  const pane = new Tweakpane();

  const assets = {
    'A.poly'          : './assets/A.poly',
    'ambulance8.svg'  : './assets/ambulance8.svg',
    'android4.svg'    : './assets/android4.svg',
    'angle.svg'       : './assets/angle.svg',
    'arrow460.svg'    : './assets/arrow460.svg',
    'bold14.svg'      : './assets/bold14.svg',
    'book95.svg'      : './assets/book95.svg',
    'gift49.svg'      : './assets/gift49.svg',
    'github10.svg'    : './assets/github10.svg',
    'guitar.poly'     : './assets/guitar.poly',
    'instagram.svg'   : './assets/instagram.svg',
    'keyboard13.svg'  : './assets/keyboard13.svg',
    'mesh02.poly'     : './assets/mesh02.poly',
    'question23.svg'  : './assets/question23.svg',
    'vimeo.svg'       : './assets/vimeo.svg',
    'volume29.svg'    : './assets/volume29.svg',
  };
  
  const params = {
    quality: true,
    quiet: true,
    vqual: 20,
    drawInput: false,
    drawNorm: true,
    str: '',
    asset: '',
  };

  const onChange = () => {
    const switches = { ...params };
    if (params.area) switches.area = parseFloat(params.varea.toFixed(3));
    if (params.quality) switches.quality = parseFloat(params.vqual.toFixed(2));

    // create output, vorout
    output = Triangle.makeIO();
    vorout = Triangle.makeIO();

    // triangulate
    Triangle.triangulate(switches, input, output, vorout);
    // update switches string
    params.str = Triangle.getSwitchesStr(switches, input, vorout);
    pane.refresh();

    // draw output, vorout
    clear();
    if (params.drawInput) draw(input, '#CCCCCC');
    draw(vorout, '#0000FF', params.drawNorm);

    // release output, vorout
    Triangle.freeIO(output);
    Triangle.freeIO(vorout);
  };

  const onAsset = () => {
    load(params.asset);
  };

  folder = pane.addFolder({ title: 'Assets' });
  folder.addInput(params, 'asset', { options: assets }).on('change', onAsset);

  folder = pane.addFolder({ title: 'Draw' });
  folder.addInput(params, 'drawInput', { label: 'input' }).on('change', onChange);
  folder.addInput(params, 'drawNorm', { label: 'norm' }).on('change', onChange);

  folder = pane.addFolder({ title: 'Switches' });
  squal = folder.addInput(params, 'vqual', { label: 'min angle', min: 0, max: 30 }).on('change', onChange);
  folder.addInput(params, 'str');

  update = onChange;
};

(async () => {
  await Triangle.init('../../triangle.out.wasm');
  load('./assets/A.poly');
  createPane();
})();
