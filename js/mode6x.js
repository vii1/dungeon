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

http://www.permadi.com/tutorial/raycast/rayc7.html
http://lodev.org/cgtutor/raycasting.html

BUGS:
- Corner cases: cuando camera.angle es multiplo de PI/2 ocurren cosas raras. Comprobar divisiones y evitar
  infinitos y divisiones entre cero.

IDEAS PARA OPTIMIZAR Mode6.draw():
- Usar coma fija
- Usar mascaras para el zbuffer?
- Usar blits y composiciones? (investigar para las sombras, efectos de luz y transparencias)
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

		var cosa = Math.cos(ca);
		var sina = Math.sin(ca);
		var tana = Math.tan(ca);

		var cosx = (sina / cz) * 2;
		var sinx = (cosa / cz) * -2;

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

		var px = cx - (cosx * w / 4);
		var py = cy - (sinx * w / 4);

		var pitch = (w * BPP)|0;

		var v = ((h - 1) * pitch)|0;
		var xv = v;
		
		var cellMap = this.map.cellMap;
		var cellsx = this.map.cellsx;
		var cellsy = this.map.cellsy;

		//function loopx() {
		for(var sx = 0; sx < w; sx += 2) {

			var mapX = (px / CELL_SIZE)|0;
			var mapY = (py / CELL_SIZE)|0;

			var mv = mapX + cellsy * mapY;

			var firstx = px;
			var firsty = py;
			var ly = h;

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

			var sy = h + ch;
			var zbuf = new Int8Array(h);
			var prevCell = null;
			var lastd = 0;
			var col = 0;
			var primex = true, primey = true;
			var pXx = px, pXy = py, pYx = px, pYy = py;

			//function loopy() {
			do {
				var cell, d;
				if(mapX >= 0 && mapX < cellsx && mapY >= 0 && mapY < cellsy)
					cell = cellMap[mv];
				else
					cell = { type: CellType.VOID };

				var incMapX, incMapY;
				if(sideDistX < sideDistY) {
					incMapX = stepX;
					incMapY = 0;
					mv += stepX;
					d = sideDistX - lastd;
					lastd = sideDistX;
					sideDistX += deltaDistX;
					if(primex) {
						px = pXx + fstepX;
						py = pXy + lastd * sina;
						primex = false;
					} else {
						px = pXx;
						py = pXy;
					}
					pXx = px + verXa;
					pXy = py + verYa;
				} else {
					incMapX = 0;
					incMapY = stepY;
					mv += stepY * cellsx;
					d = sideDistY - lastd;
					lastd = sideDistY;
					sideDistY += deltaDistY;
					if(primey) {
						px = pYx + lastd * cosa;
						py = pYy + fstepY;
						primey = false;
					} else {
						px = pYx;
						py = pYy;
					}
					pYx = px + horXa;
					pYy = py + horYa;
				}

				var sh = ((d / SQRT2) * cz);
				var salt = (sy - sh)|0;

				//function paintcell() {
				switch(cell.type) {
					case CellType.VOID:
						var texR = (mapX << 2) & 0xFF;
						var texG = (mapY << 2) & 0xFF;
						var texB = ((mapX ^ mapY) & 1) * 128;
						/*while(ly > salt) {
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
						}*/
						if(ly > salt) {
							ctx.fillStyle = 'rgb('+texR+','+texG+','+texB+')';
							ctx.fillRect(sx,salt,2,ly-salt);
							ly = salt;
						}
						break;
				}
				//}
				//paintcell();

				mapX += incMapX;
				mapY += incMapY;
				//prevCell = cell;
				sy -= sh;
			} while(sy >= 0);
			//}
			//loopy();

			px = firstx + cosx;
			py = firsty + sinx;

			xv = v = xv + (BPP<<1);
		}
		//}
		//loopx();

		//ctx.putImageData(imageData, 0, 0);
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
