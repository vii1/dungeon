/*
	POR HACER:
	- Hacer un mapa de alturas más decente
	- Hay que precalcular la normal de cada voxel. Se puede guardar aparte un mapa de normales.
	- Mapa de texturas, para no tener que decidir la textura a partir de la normal. Además da
	  más flexibilidad.
	- Precalcular iluminación
	- Dibujar slabs
	- Si todo falla... fijar el ángulo de la cámara en 45º :(
 */
function Mode6() {

	var BPP = 4 |0;
	var TSIZE = ((1024*1024*4)-1) |0;

	var canvas;
	var ctx;
	var imageData;
	var w, h;

	var texture = null;
	var texture2 = null;
	var heightmap = null;

	var pixdata = null;

	function putPixel(v, col) {
		pixdata[v  ] = col[0];
		pixdata[v+1] = col[1];
		pixdata[v+2] = col[2];
		//pixdata[v+3] = 255;
		pixdata[v+4] = col[0];
		pixdata[v+5] = col[1];
		pixdata[v+6] = col[2];
		//pixdata[v+7] = 255;
	}

	this.init = function(_canvas) {
		canvas = _canvas;
		w = canvas.width|0;
		h = canvas.height|0;
		ctx = canvas.getContext('2d');
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0, 0, w, h);
		pixdata = imageData.data;
		//state = new DrawState(h);
		//for(var i=3; i<pixdata.length; i+=4)
		//	pixdata[i] = 255;
	}

	this.setMaps = function (_texture, _texture2, _heightmap) {
		texture = getImageData(_texture);
		texture2 = getImageData(_texture2);
		heightmap = getImageData(_heightmap);
	}

	this.draw = function(camera) {
		/*ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0, 0, w, h);
		pixdata = imageData.data;*/

		var ch = camera.h;
		var cx = camera.x;
		var cy = camera.y;
		var ca = camera.angle * RAD;
		var cz = camera.zoom;

		var cosy = Math.cos(ca) * SQRT2 / cz;
		var siny = Math.sin(ca) * SQRT2 / cz;
		var cosx = Math.cos(ca - RAD90) / cz;
		var sinx = Math.sin(ca - RAD90) / cz;

		var sx;

		var px = cx - (cosx * w / 2);
		var py = cy - (sinx * w / 2);

		var pitch = (w * BPP);
		var hpitch = (h * pitch);

		var v = (hpitch - pitch);
		var xv = v;
		var pitch2 = (texture2.width|0) * BPP;


		for(sx = 0; sx < w; sx+=2) {
			var firstx = px;
			var firsty = py;
			var ly = h;
			var vacio = false;

			var sy = h + ch;
			var zbuf = new Int8Array(h);

			while(sy >= 0) {
				var tv0 = ((((px     ) & 1023) + ((py     ) & 1023) * 1024) << 2);
				var tv1 = ((((px >> 1) & 1023) + ((py >> 1) & 1023) * 1024) << 2);
				var tv2 = ((((px >> 2) & 1023) + ((py >> 2) & 1023) * 1024) << 2);
				var alt = heightmap.data[tv0];
				var texR, texG, texB;

				var salt = (sy - (alt * cz))|0;

				if(salt < 0)
					salt = 0;

				if(alt === 255) {
					vacio = true;
				}
				else {
					if(salt > ly) {
						vacio = true;
					}
					else {
						vacio = false;
						texR = texture.data[tv0];
						texG = texture.data[tv0+1];
						texB = texture.data[tv0+2];
					}
				}

				if(vacio) {
					v -= pitch * (ly - salt);
					ly = salt;
				}
				else if(ly > salt) {

					//var fade = 256 - alt;

					if(ly-(sy-alt*cz) > 20*cz) {
						// textura vertical
						var v2 = (((px + py) >> 1) % 600) << 2;
						v2 += pitch2 * (447 +ly-sy)|0;
						var t2data = texture2.data;

						while(ly > salt) {
							--ly;
							if(!zbuf[ly]) {
								texR = t2data[v2]   /** fade >> 8*/;
								texG = t2data[v2+1] /** fade >> 8*/;
								texB = t2data[v2+2] /** fade >> 8*/;
								pixdata[v  ] = texR;
								pixdata[v+1] = texG;
								pixdata[v+2] = texB;
								pixdata[v+4] = texR;
								pixdata[v+5] = texG;
								pixdata[v+6] = texB;
								zbuf[ly] = 1;
							}
							v -= pitch;
							v2 -= pitch2;
						}
					}
					else {
						// textura horizontal

						/*texR = (texR * fade) >> 8;
						texG = (texG * fade) >> 8;
						texB = (texB * fade) >> 8;*/


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
				}

				px += cosy * 2;
				py += siny * 2;

				sy -= 2;

			}

			//state.reset();

			px = firstx + cosx * 2;
			py = firsty + sinx * 2;

			xv = v = xv + (BPP<<1);
		}

		ctx.putImageData(imageData, 0, 0);
	}
}
