// Esta version de mode6x es anterior a empezar a implementar el raycasting para rastrear las celdas del mapa
/*
DESCRIPCIÓN
El modo6x es en esencia un mapa de tiles. Cada tile puede ser de varios tipos:
- Vacío
- Suelo
- Irregular (voxels)
- ¿Otros? (pared...)
Cada tipo está optimizado para su caso específico. Si algún tile requiere alguna modificación en tiempo real,
se convertirá a tipo irregular.

VOXELS
Una casilla de voxels está formada por una matriz cuadrada de listas enlazadas. Cada elemento de la lista
enlazada es un slab. (La lista puede estar vacía). Un slab contiene los siguientes datos:
- Puntero a una posición específica de una textura (si se llega al límite de la textura, se debe usar otro
 slab a continuación). Si hay que hacer modificaciones, es preferible modificar el slab a modificar la
 propia textura (ya que muchos slabs pueden apuntar a la misma textura).
- Altura donde comienza el slab
- Longitud del slab
- Máscara de visibilidad (indicando cuáles de sus 4 lados son visibles)
- Puntero al siguiente slab

MAPA DE DUREZAS
El mapa de durezas tiene 2 niveles: general y por tile. El general debe tener al menos 3 estados (caminable,
no caminable y mixto o irregular). El estado mixto apunta al mapa de durezas de esa casilla en concreto.

SPRITES 3D
Los sprites 3D pueden estar colocados a cualquier altura y pueden rotar sobre su eje Y. Antes del render se
calculan sus bounding box, de forma que al dibujar cada columna sabemos qué sprites estarán implicados y en
qué coordenadas de pantalla hay que empezar a consultarlos.
Su formato es similar a una tile de voxels. Consisten en una matriz de la que salen listas de slabs. La
principal diferencia sería que la textura puede ser 1-D e incluso varios slabs pueden reutilizar la misma
parte de la textura, ya que los sprites 3D no pretenden ser modificables.

*/

"use strict";

function Mode6x() {
	var BPP = 4 |0;

	var canvas;
	var ctx;
	var imageData;
	var w, h;

	var pixdata = null;

	this.showGrid = false;

	this.camera = null;

	this.map = null;

	this.init = function(_canvas) {
		canvas = _canvas;
		w = canvas.width|0;
		h = canvas.height|0;
		ctx = canvas.getContext('2d');
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0, 0, w, h);
		pixdata = imageData.data;
	}

	this.draw = function() {
		/*ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0, 0, w, h);
		pixdata = imageData.data;*/

		var ch = this.camera.h;
		var cx = this.camera.x;
		var cy = this.camera.y;
		var ca = this.camera.angle * RAD;
		var cz = this.camera.zoom;

		var cosy = Math.cos(ca) * SQRT2 / cz;
		var siny = Math.sin(ca) * SQRT2 / cz;
		var cosx = Math.cos(ca - RAD90) / cz;
		var sinx = Math.sin(ca - RAD90) / cz;

		var sx;

		var px = cx - (cosx * w / 2);
		var py = cy - (sinx * w / 2);

		var pitch = (w * BPP)|0;
		var hpitch = (h * pitch)|0;

		var v = (hpitch - pitch)|0;
		var xv = v;
		//var pitch2 = (texture2.width|0) * BPP;


		for(sx = 0; sx < w; sx += 2) {
			var firstx = px;
			var firsty = py;
			var ly = h;
			var vacio = false;

			var sy = h + ch;
			var zbuf = new Int8Array(h);

			while(sy >= 0) {
				//var tv0 = ((((px     ) & 1023) + ((py     ) & 1023) * 1024) << 2);
				//var tv1 = ((((px >> 1) & 1023) + ((py >> 1) & 1023) * 1024) << 2);
				//var tv2 = ((((px >> 2) & 1023) + ((py >> 2) & 1023) * 1024) << 2);
				//var alt = heightmap.data[tv2];
				var alt = 0;
				var texR, texG, texB;

				var salt = (sy - (alt))|0;

				if(salt < 0)
					salt = 0;

				/*if(alt === 255) {
					vacio = true;
				}
				else {
					if(salt > ly) {
						vacio = true;
					}
					else {
						vacio = false;
						texR = texture.data[tv2];
						texG = texture.data[tv2+1];
						texB = texture.data[tv2+2];
					}
				}*/
				if(this.showGrid && ((px|0) % CELL_SIZE == 0 || (py|0) % CELL_SIZE == 0)) {
					texR = texG = texB = 128;
				} else {
					texR = (px|0) % 128;
					texG = (py|0) % 128;
					texB = 0;
				}

				if(vacio) {
					v -= pitch * (ly - salt);
					ly = salt;
				}
				else if(ly > salt) {

					while(ly > salt) {
						--ly;
						if(!zbuf[ly]) {
							pixdata[v  ] = texR;
							pixdata[v+1] = texG;
							pixdata[v+2] = texB;
							pixdata[v+4] = texR;
							pixdata[v+5] = texG;
							pixdata[v+6] = texB;
							zbuf[ly] = 1;
						}
						v -= pitch;
					}

				}

				px += cosy * 2;
				py += siny * 2;

				sy -= 2;
				if(sy == -1) sy=0;
			}

			//state.reset();

			px = firstx + cosx * 2;
			py = firsty + sinx * 2;

			xv = v = xv + (BPP<<1);
		}

		ctx.putImageData(imageData, 0, 0);
	}

	// Por ahora detecta colisión con el PLANO (h=0), no con el relieve
	this.screen2world = function(sx, sy) {
		var ch = this.camera.h;
		var cx = this.camera.x;
		var cy = this.camera.y;
		var ca = this.camera.angle * RAD;
		var cz = this.camera.zoom;

		var cosy = Math.cos(ca) * SQRT2 / cz;
		var siny = Math.sin(ca) * SQRT2 / cz;
		var cosx = Math.cos(ca - RAD90) / cz;
		var sinx = Math.sin(ca - RAD90) / cz;

		var px = cx + cosx * (-(w>>1) + sx) + cosy * (ch + h - sy - 1);
		var py = cy + sinx * (-(w>>1) + sx) + siny * (ch + h - sy - 1);

		return {x: px, y:py};
	}

	// ditto
	this.world2screen = function(px, py) {
		var ch = this.camera.h;
		var cx = this.camera.x;
		var cy = this.camera.y;
		var ca = this.camera.angle * RAD;
		var cz = this.camera.zoom;

		var cosa = Math.cos(ca);
		var sina = Math.sin(ca);

		var sx = (w + 2*cz*(cy - py)*cosa - 2*cz*(cx - px)*sina) / 2;
		var sy = (SQRT2*(-1 + ch + h) + cz*(cx - px)*cosa + cz*(cy - py)*sina)/SQRT2;

		return {x: sx, y: sy};
	}
}
