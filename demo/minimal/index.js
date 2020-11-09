const Triangle = require('../../');
const unflat = require('array-unflat');

// init canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 640;
canvas.height = 640;

// init data
const data = { pointlist: [-1, -1, 1, -1, 1, 1, -1, 1] };

// init triangle
Triangle.init().then(() => {
  const input = Triangle.makeIO(data);
  const output = Triangle.makeIO();
  
  Triangle.triangulate({ quality: true }, input, output);
  
  // draw output
  draw(output);
  
  // free memory
  Triangle.freeIO(input);
  Triangle.freeIO(output);
});

// multiply scalar an array of 2D points
const scale = (points, sx, sy) => {
	for (let i = 0; i < points.length; i++) {
		points[i][0] *= sx;
		points[i][1] *= sy;
	}
};

// draw onto canvas
const draw = (data) => {
	const points = unflat(data.pointlist);
	const triangles = unflat(data.trianglelist, 3);

	// scale up to 80% of the canvas
	scale(points, canvas.width * 0.4, canvas.height * 0.4);

	ctx.fillStyle = '#eee';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.save();
	ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
	ctx.fillStyle = '#000';
  ctx.lineWidth = 2;
	
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
