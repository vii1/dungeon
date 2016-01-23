"use strict";

var RAD = Math.PI / 180.0;
var RAD90 = Math.PI * 0.5;
var SQRT2 = Math.sqrt(2);

// Reduce un ángulo a su equivalente dentro de [0,360)
function wrapAngle(a) {
	a = a % 360;
	while(a < 0)
		a += 360;
	return +a;
}

// Reduce un número entero al rango [0, limit)
function wrap(n, limit) {
	n = n|0;
	limit = limit|0;
	n %= limit;
	while(n < 0)
		n += limit;
	return n|0;
}

// Obtiene un objeto ImageData a partir de un objeto Image
function getImageData(img) {
	var canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	return ctx.getImageData(0, 0, img.width, img.height);
}

// Dando por hecho que la imagen está en tono de grises, obtiene
// el valor de un píxel
function getPixel8(imgData, x, y) {
	return imgData.data[(y * imgData.width + x) * 4];
}

// Obtiene el valor de un píxel en forma de array de 3 valores
// (sin canal alpha)
function getPixel24(imgData, x, y) {
	var p = (y * imgData.width + x) * 4;
	return [ imgData.data[p], imgData.data[p+1], imgData.data[p+2] ];
}

// Obtiene el valor de un píxel en forma de array de 4 valores
function getPixel32(imgData, x, y) {
	var p = (y * imgData.width + x) * 4;
	return [
		imgData.data[p], imgData.data[p+1],
		imgData.data[p+2], imgData.data[p+3]
	];
}

// Carga una imagen
function loadImage(uri, callback) {
	var img = new Image();
	img.onload = callback;
	img.src = uri;
	return img;
}

function DrawState(h) {
	h = h|0;

	// La lista guarda los huecos
	var lista = { y1: 0, y2: h-1, next: null };

	function cons(i, l) {
		if(i) i.next = l;
		return i||l;
	}

	//function min(a,b) { return a<b?a:b; }
	//function max(a,b) { return a>b?a:b; }
	var min = Math.min, max = Math.max;

	function intersect(a, b) {
		if(b.y1 > a.y2 || b.y2 < a.y1)
			return [null, null, a];
		var c1 = min(a.y1, b.y1);
		var c2 = max(a.y1, b.y1);
		var c3 = min(a.y2, b.y2);
		var c4 = max(a.y2, b.y2);
		var i1, i2, i3;
		if(c1 < c2 && c1 >= a.y1) i1 = { y1: c1, y2: c2-1, next: null };
		i2 = { y1: c2, y2: c3, next: null };
		if(c3 < c4 && c4 <= a.y2) i3 = { y1: c3+1, y2: c4, next: null };
		return [i1, i2, i3];
	}

	function quitadelista(i, l) {
		if(!i || !l)
			return [null, null];
		var a = intersect(l, i);
		var r = quitadelista(i, l.next);
		return [cons(a[1], r[0]), cons(a[0], cons(a[2], r[1]))];
	}

	/* fill - rellena un rango, es decir, quita huecos
	 * Paso 1: Obtenemos la intersección entre la lista y el rango que nos dan
	 * Paso 2: Quitamos el rango de la lista
	 * Paso 3: Devolvemos la intersección antes calculada
	 */
	this.fill = function(y1, y2) {
		y1 = y1|0;
		y2 = y2|0;
		if(!lista)
			return null;
		var r = quitadelista({y1:y1, y2:y2, next:null}, lista);
		lista = r[1];
		return r[0];
	}

	/* find - busca el siguiente hueco a partir de y
	 */
	this.find = function(y) {
		y = y|0;
		var l = lista;
		while(l) {
			if(l.y1 >= y)
				return l.y1;
			l = l.next;
		}
		return null;
	}

	this.len = function() {
		var n = 0;
		var l = lista;
		while(l) {
			++n;
			l = l.next;
		}
		return n;
	}

	this.reset = function() {
		lista = { y1: 0, y2: h-1, next: null };
	}
}

function advance(obj, dist, angle) {
	if(!angle)
		angle = obj.angle;
	obj.x += Math.cos(angle * RAD) * dist;
	obj.y += Math.sin(angle * RAD) * dist;
}

var dispTimeout = null;

function display(msg) {
	var mensaje = document.getElementById('mensaje');
	mensaje.innerText = msg;
	console.log(msg);
	if(dispTimeout) {
		clearTimeout(dispTimeout);
	}
	dispTimeout = setTimeout(function() {
		mensaje.innerText = " ";
		dispTimeout = null;
	}, 4000);
}

function assert(condition, message) {
	if(console.assert) {
		console.assert(condition, message);
	} else if(!condition) {
		throw message || "Assertion failed";
	}
}
