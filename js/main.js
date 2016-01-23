var canvas, ctx;
var ready = 0;
var textura, alturas;
var mode6;
var cam = { x:859, y:343, h:255, angle:40, zoom: 1 };
var time;
var numframes;
var fps;
var elemFps;
var now;
var dtime;
var auto = false;
var w,h;
var vsync = true;

function checkReady() {
	ready++;
	if(ready == 3)
		initGame();
}

function main() {
	var dataURI = 'http://divero.net/~vii/dungeon/data/'
	canvas = document.getElementById('canvas');
	w = canvas.width;
	h = canvas.height;
	ctx = canvas.getContext('2d');
	textura = loadImage(dataURI + 'textures/mazmorra2_tex.png', checkReady);
	textura2 = loadImage(dataURI + 'textures/pared.jpg', checkReady);
	alturas = loadImage(dataURI + 'textures/mazmorra2.png', checkReady);
	elemFps = document.getElementById('fps');
}

function initGame() {
	document.getElementById('cargando').style.display = 'none';
	mode6 = new Mode6();
	mode6.init(canvas);
	mode6.setMaps(textura, textura2, alturas);
	now = time = Date.now();
	numframes = 0;
	fps = 0;
	document.addEventListener('keydown', Key.onKeyDown, false);
	document.addEventListener('keyup', Key.onKeyUp, false);
	canvas.addEventListener('contextmenu', Mouse.onContextMenu, false);
	canvas.addEventListener('mousedown', Mouse.onMouseDown, false);
	canvas.addEventListener('mouseup', Mouse.onMouseUp, false);
	if(vsync)
		requestAnimationFrame(gameLoop);
	else
		setTimeout(gameLoop,1);
}

function gameLoop() {
	dtime = Date.now() - now;
	now = Date.now();

	processInput();

	mode6.draw(cam);

	if(auto) {
		cam.x += Math.cos(cam.angle * Math.PI / 180.0) * 300 / 1000 * dtime;
		cam.y += Math.sin(cam.angle * Math.PI / 180.0) * 300 / 1000 * dtime;
		cam.angle = wrapAngle (cam.angle + 9 / 1000 * dtime);
	}

	++numframes;
	var t = now - time;
	if(t >= 100) {
		fps = numframes * 1000 / t;
		numframes = 0;
		time = now;
	}
	elemFps.innerText = fps.toFixed(1);

	if(vsync)
		requestAnimationFrame(gameLoop);
	else
		setTimeout(gameLoop,1);
}

function processInput() {
	if(Key.isDown(Key.Q)) {
		cam.x += (Math.cos(cam.angle * RAD) - Math.cos((cam.angle+2) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.y += (Math.sin(cam.angle * RAD) - Math.sin((cam.angle+2) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.angle = wrapAngle(cam.angle+2);
	}
	if(Key.isDown(Key.E)) {
		cam.x += (Math.cos(cam.angle * RAD) - Math.cos((cam.angle-2) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.y += (Math.sin(cam.angle * RAD) - Math.sin((cam.angle-2) * RAD)) * (cam.h + h*(SQRT2-0.5)) / cam.zoom;
		cam.angle = wrapAngle(cam.angle-2);
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
		cam.zoom *= 2;
		advance(cam, h*SQRT2/cam.zoom);
		display("ZOOM: "+cam.zoom+"x");
	}
}
