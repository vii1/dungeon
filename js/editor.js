"use strict";

var DATA_URI = 'http://divero.net/~vii/dungeon/data/'

var canvas, ctx;
//var ready = 0;
//var textura, alturas;
var mode6;
var cam = { x:0, y:0, h:255, angle:45, zoom: 1 };
var timefps;
var numframes;
var fps;
var elemFps;
var now;
var dtime;
var w,h;
var vsync = true;
var mouse;
var totalResources = 0;
var resourcesLoaded = 0;

var m1x, m1y, m2x, m2y;
var raycasteando = false;

var editor = {
	showAxis: true
};

var res = {
	textures: {
		file: 'textures.json',
		type: 'json',
		onload: function() {
			loadImages(res.textures.data);
		}
	}
};


function checkReady() {
	resourcesLoaded++;
	if(resourcesLoaded == totalResources)
		initGame();
}

function loadImages(resInfo) {
	var keys = Object.keys(resInfo);
	for(var i=0; i<keys.length; i++) {
		resInfo[keys[i]].img = loadImage(DATA_URI + resInfo[keys[i]].file, checkReady);
	}
}

function resJSONLoaded(xhr, resInfo) {
	resInfo.data = JSON.parse(xhr.responseText);
	if(resInfo.onload)
		resInfo.onload();
	checkReady();
}

function loadRes(resInfo) {
	var xhr = new XMLHttpRequest();
	switch(resInfo.type) {
		case 'json':
			xhr.onload = function() { resJSONLoaded(this, resInfo); };
			xhr.open('get', DATA_URI + resInfo.file, true);
			break;
		default:
			return;
	}
	xhr.send();
}

function main() {
	canvas = document.getElementById('canvas');
	w = canvas.width;
	h = canvas.height;
	ctx = canvas.getContext('2d');

	var resk = Object.keys(res);
	totalResources = resk.length;
	for(var i=0; i<resk.length; i++) {
		loadRes(res[resk[i]]);
	}
	//textura = loadImage(DATA_URI + 'textures/mazmorra2_tex.png', checkReady);
	//textura2 = loadImage(DATA_URI + 'textures/pared.jpg', checkReady);
	//alturas = loadImage(DATA_URI + 'textures/mazmorra2.png', checkReady);
	elemFps = document.getElementById('fps');
	//initGame();
}

function initGame() {
	document.getElementById('cargando').style.display = 'none';

	var map = new Map(32, 32);

	mode6 = new Mode6x();
	mode6.init(canvas);
	mode6.camera = cam;
	mode6.map = map;
	mode6.showGrid = true;
	now = timefps = Date.now();
	numframes = 0;
	fps = 0;
	canvas.addEventListener('keydown', Key.onKeyDown, false);
	canvas.addEventListener('keyup', Key.onKeyUp, false);
	canvas.addEventListener('contextmenu', Mouse.onContextMenu, false);
	canvas.addEventListener('mousedown', Mouse.onMouseDown, false);
	canvas.addEventListener('mouseup', Mouse.onMouseUp, false);
	canvas.addEventListener('mousemove', Mouse.onMouseMove, false);
	canvas.addEventListener('mouseover', Mouse.onMouseOver, false);
	canvas.addEventListener('mouseout', Mouse.onMouseOut, false);
	if(vsync)
		requestAnimationFrame(gameLoop);
	else
		setTimeout(gameLoop,1);
}

function labels(sx, sy, text) {
	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.lineTo(sx, sy - 20);
	ctx.stroke();
	ctx.fillText(text, sx, sy - 21);
}

function labelw(wx, wy, text) {
	var p = mode6.world2screen(wx, wy);
	labels(p.x, p.y, text);
}

function paint() {
	mode6.draw();

	if(editor.showAxis) {
		var o = mode6.world2screen(0, 0);
		var ox = mode6.world2screen(CELL_SIZE * 2, 0);
		var oy = mode6.world2screen(0, CELL_SIZE * 2);
		ctx.strokeStyle = '#FFFF00';
		ctx.lineWidth = Math.max(1, cam.zoom * 2);
		ctx.beginPath();
		ctx.moveTo(ox.x, ox.y);
		ctx.lineTo(o.x, o.y);
		ctx.lineTo(oy.x, oy.y);
		ctx.stroke();
		ctx.moveTo(o.x, o.y);
		ctx.lineTo(o.x, o.y - CELL_SIZE * 2 * cam.zoom);
		ctx.stroke();
		ctx.fillStyle = '#FFFF00';
		ctx.font = ''+(12*cam.zoom)+'px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('x', ox.x, ox.y);
		ctx.fillText('y', oy.x, oy.y);
		ctx.fillText('z', o.x, o.y - CELL_SIZE * 2 * cam.zoom);
	}

	if(Mouse.isOver()) {
		if(raycasteando) {
			var col = now % 256;
			ctx.strokeStyle = 'rgb(0,'+col+','+col+')';
			ctx.lineWidth = Math.max(1, cam.zoom);
			ctx.beginPath();
			ctx.moveTo(m1x, m1y);
			ctx.lineTo(m2x, m2y);
			ctx.stroke();

			ctx.fillStyle = ctx.strokeStyle = 'rgb(255,0,255)';
			ctx.font = ''+(10*cam.zoom)+'px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';

			labels(m1x, m1y, 'P');

			if(m1x != m2x && m1y != m2y) {
				var p1 = mode6.screen2world(m1x, m1y);
				var p2 = mode6.screen2world(m2x, m2y);
				var dx = p2.x - p1.x, dy = p2.y - p1.y;
				var a = Math.atan2(dy, dx);
				//ctx.fillText(''+(a*180/Math.PI).toFixed(1)+'°', m1x + 20, m1y);

				var maxDist = Math.sqrt(dx*dx+dy*dy);

				var cosa = Math.cos(a);
				var sina = Math.sin(a);
				var tana = Math.tan(a);

				// intersecciones horizontales
				var stepY = sina > 0 ? 1 : -1;
				var horXa = CELL_SIZE / tana * stepY;
				var horYa = stepY * CELL_SIZE;

				// intersecciones verticales
				var stepX = cosa > 0 ? 1 : -1;
				var verXa = stepX * CELL_SIZE;
				var verYa = CELL_SIZE * tana * stepX;

				var deltaDistX = verXa / cosa;
				var deltaDistY = horYa / sina;

				var px = p1.x, py = p1.y;

				var mapX = (px / CELL_SIZE)|0;
				var mapY = (py / CELL_SIZE)|0;

				var sideDistX, sideDistY;
				var fstepX, fstepY;

				if(cosa < 0) {
					fstepX = px - (mapX * CELL_SIZE);
					sideDistX = fstepX * deltaDistX / CELL_SIZE;
				} else {
					fstepX = ((mapX + 1) * CELL_SIZE) - px;
					sideDistX = fstepX * deltaDistX / CELL_SIZE;
				}
				if(sina < 0) {
					fstepY = py - (mapY * CELL_SIZE);
					sideDistY = fstepY * deltaDistY / CELL_SIZE;
				} else {
					fstepY = ((mapY + 1) * CELL_SIZE) - py;
					sideDistY = fstepY * deltaDistY / CELL_SIZE;
				}

				labelw(px + sideDistX * cosa, py + sideDistX * sina, 'sDX');
				labelw(px + sideDistY * cosa, py + sideDistY * sina, 'sDY');

				var lastd = 0;
				var firstx = true, firsty = true;
				var pXx = px, pXy = py, pYx = px, pYy = py;

				while(lastd <= maxDist) {
					var d;
					if(sideDistX < sideDistY) {
						mapX += stepX;
						d = sideDistX - lastd;
						lastd = sideDistX;
						sideDistX += deltaDistX;
						if(firstx) {
							px = pXx + lastd * cosa;
							py = pXy + lastd * sina;
							pXx = px + verXa;
							pXy = py + verYa;
							firstx = false;
						} else {
							px = pXx;
							py = pXy;
							pXx += verXa;
							pXy += verYa;
						}
						labelw(px, py, 'X');
					} else {
						mapY += stepY;
						d = sideDistY - lastd;
						lastd = sideDistY;
						sideDistY += deltaDistY;
						if(firsty) {
							px = pYx + lastd * cosa;
							py = pYy + lastd * sina;
							pYx = px + horXa;
							pYy = py + horYa;
							firsty = false;
						} else {
							px = pYx;
							py = pYy;
							pYx += horXa;
							pYy += horYa;
						}
						labelw(px, py, 'Y');
					}
				}
			}
		}
		else {
			var pos = mode6.screen2world(mouse.x, mouse.y);
			var x1 = Math.floor(pos.x / CELL_SIZE) * CELL_SIZE;
			var x2 = x1 + CELL_SIZE;
			var y1 = Math.floor(pos.y / CELL_SIZE) * CELL_SIZE;
			var y2 = y1 + CELL_SIZE;
			var p1 = mode6.world2screen(x1, y1);
			var p2 = mode6.world2screen(x1, y2);
			var p3 = mode6.world2screen(x2, y2);
			var p4 = mode6.world2screen(x2, y1);
			var col = now % 256;
			ctx.strokeStyle = 'rgb(0,'+col+','+col+')';
			ctx.lineWidth = Math.max(1, cam.zoom * 2);
			ctx.beginPath();
			ctx.moveTo(p1.x, p1.y);
			ctx.lineTo(p2.x, p2.y);
			ctx.lineTo(p3.x, p3.y);
			ctx.lineTo(p4.x, p4.y);
			ctx.closePath();
			ctx.stroke();
		}
	}
}	

function gameLoop() {
	var n = Date.now();
	dtime = n - now;
	now = n;

	processInput();
	paint();

	++numframes;
	var t = now - timefps;
	if(t >= 100) {
		fps = numframes * 1000 / t;
		numframes = 0;
		timefps = now;
	}
	elemFps.innerText = fps.toFixed(1);

	if(vsync)
		requestAnimationFrame(gameLoop);
	else
		setTimeout(gameLoop,1);
}

function processInput() {
	var ang = 0.09 * dtime;

	mouse = Mouse.getPosition();

	if(Key.isDown(Key.Q)) {
		cam.x += (Math.cos(cam.angle * RAD) - Math.cos((cam.angle+ang) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.y += (Math.sin(cam.angle * RAD) - Math.sin((cam.angle+ang) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.angle = wrapAngle(cam.angle+ang);
	}
	if(Key.isDown(Key.E)) {
		cam.x += (Math.cos(cam.angle * RAD) - Math.cos((cam.angle-ang) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.y += (Math.sin(cam.angle * RAD) - Math.sin((cam.angle-ang) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.angle = wrapAngle(cam.angle-ang);
	}
	if(Key.isDown(Key.W)) {
		advance(cam, 0.3 * dtime / cam.zoom);
	}
	if(Key.isDown(Key.S)) {
		advance(cam, -0.3 * dtime / cam.zoom);
	}
	if(Key.isDown(Key.A)) {
		advance(cam, 0.3 * dtime / cam.zoom, cam.angle + 90);
	}
	if(Key.isDown(Key.D)) {
		advance(cam, 0.3 * dtime / cam.zoom, cam.angle - 90);
	}
	if(Key.isJustDown(Key.F)) {
		if(cam.zoom > 0.25) {
			advance(cam, -h*SQRT2/cam.zoom);
			cam.zoom /= 2;
		}
		display("ZOOM: "+cam.zoom+"x");
	}
	if(Key.isJustDown(Key.R)) {
		if(cam.zoom < 8) {
			cam.zoom *= 2;
			advance(cam, h*SQRT2/cam.zoom);
			display("ZOOM: "+cam.zoom+"x");
		}
	}

	if(Mouse.isDown(Mouse.LEFT)) {
		if(!raycasteando) {
			raycasteando = true;
			m1x = m2x = mouse.x;
			m1y = m2y = mouse.y;
		}
		else {
			m2x = mouse.x;
			m2y = mouse.y;
		}
	}
	else {
		raycasteando = false;
	}
}