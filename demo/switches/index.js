const Triangle = require('../../');
const polyparse = require('poly-parse');
const svgToPoly = require('svg-to-poly');
const loadSvg = require('load-svg');
const opentype = require('opentype.js');
const unflat = require('array-unflat');
const Tweakpane = require('tweakpane');

// local vars
let input, output, update, font;
let text = 'E';

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
  else if (path.includes('.poly') || path.includes('.node')) {
    fetch(path)
    .then(result => result.text())
    .then(result => {
      const data = polyparse(result, { normalize: true, flipY: true });
      setup(data);
    });
  }
  // font
  else {
    opentype.load(path, (err, _font) => {
      if (err) throw err;

      font = _font;
      updateText();
    });
  }
};

const updateText = () => {
  const path = font.getPath(text, 0, 0, 120);
  const svg = path.toSVG();
  const data = svgToPoly(svg, { normalize: true });
  setup(data);
};

const setup = (data) => {
  // flatten all arrays
  flatten(data);

  // release old input
  if (input) Triangle.freeIO(input);
  // store new input
  input = Triangle.makeIO(data);

  update();
};


// draw onto canvas
const draw = (data) => {
  const points = unflat(data.pointlist);
  const triangles = unflat(data.trianglelist, data.numberofcorners);

  // scale up to 80% of the canvas
  scale(points, canvas.width * 0.4, canvas.height * 0.4);

  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
  ctx.fillStyle = '#000';
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

  ctx.restore();
};


// parameters panel
const createPane = () => {
  let folder, squal, sarea, stext;
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
    'times-subset.ttf': './assets/times-subset.ttf',
  };
  
  const params = {
    quality: false,
    area: false,
    ccdt: false,
    convexHull: false,
    holes: true,
    quiet: true,
    varea: 0.1,
    vqual: 20,
    steiner: 300,
    text: text,
    str: '',
    asset: '',
  };

  const onChange = () => {
    const switches = { ...params };
    if (params.area) switches.area = parseFloat(params.varea.toFixed(3));
    if (params.quality) switches.quality = parseFloat(params.vqual.toFixed(2));

    params.str = Triangle.getSwitchesStr(switches, input);
    pane.refresh();

    // create output
    output = Triangle.makeIO();
    // triangulate
    Triangle.triangulate(switches, input, output);
    // draw output
    draw(output);
    // release outpu
    Triangle.freeIO(output);

    squal.hidden = !params.quality;
    sarea.hidden = !params.area;
    stext.hidden = !params.asset.includes('.ttf');
  };

  const onAsset = () => {
    load(params.asset);
  };

  const onText = () => {
    text = params.text.substr(0, 4);
    updateText();
  };

  folder = pane.addFolder({ title: 'Assets' });
  folder.addInput(params, 'asset', { options: assets }).on('change', onAsset);
  stext = folder.addInput(params, 'text').on('change', onText);

  folder = pane.addFolder({ title: 'Switches' });
  folder.addInput(params, 'quality').on('change', onChange);
  squal = folder.addInput(params, 'vqual', { label: 'min angle', min: 0, max: 30 }).on('change', onChange);
  folder.addInput(params, 'area').on('change', onChange);
  sarea = folder.addInput(params, 'varea', { label: 'max area', min: 0.005, max: 0.1, step: 0.001 }).on('change', onChange);
  folder.addInput(params, 'ccdt').on('change', onChange);
  folder.addInput(params, 'convexHull').on('change', onChange);
  folder.addInput(params, 'holes').on('change', onChange);
  folder.addInput(params, 'quiet').on('change', onChange);
  folder.addInput(params, 'steiner', { min: 0, max: 300, step: 1 }).on('change', onChange);
  folder.addInput(params, 'str');

  squal.hidden = !params.quality;
  sarea.hidden = !params.area;
  stext.hidden = !params.asset.includes('.ttf');

  update = onChange;
};

(async () => {
  await Triangle.init('../../triangle.out.wasm');
  load('./assets/A.poly');
  createPane();
})();
