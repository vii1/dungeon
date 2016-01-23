/*
	POR HACER:
	- Hacer un mapa de alturas más decente
	- Hay que precalcular la normal de cada voxel. Se puede guardar aparte un mapa de normales.
	- Solucionar el overdraw ("z-buffer")
	- Mapa de texturas, para no tener que decidir la textura a partir de la normal. Además da
	  más flexibilidad.
	- Precalcular iluminación
	- Si todo falla... fijar el ángulo de la cámara en 45º :(
 */
function Mode6() {

	var RAD = Math.PI / 180.0;
	var BPP = 4 |0;
	var SQRT2 = Math.sqrt(2);
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
		ctx = canvas.getContext('2d');
		imageData = ctx.createImageData(canvas.width, canvas.height);
		w = canvas.width|0;
		h = canvas.height|0;
		pixdata = imageData.data;
		for(var i=3; i<pixdata.length; i+=4)
			pixdata[i] = 255;
	}

	this.setMaps = function (_texture, _texture2, _heightmap) {
		texture = getImageData(_texture);
		texture2 = getImageData(_texture2);
		heightmap = getImageData(_heightmap);
	}

	this.draw = function(camera) {
		/*ctx.setFillColor('black');
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0,0,w, h);
		pixdata = imageData.data;*/
		var cosy = Math.cos(camera.angle * RAD)*SQRT2;
		var siny = Math.sin(camera.angle * RAD)*SQRT2;
		var cosx = Math.cos((camera.angle - 90) * RAD)*2;
		var sinx = Math.sin((camera.angle - 90) * RAD)*2;

		var ch = camera.h;
		var cx = camera.x;
		var cy = camera.y;

		var sx;

		var px = cx - (cosx * w / 4);
		var py = cy - (sinx * w / 4);

		var pitch = (w * BPP);
		var hpitch = (h * pitch);

		var v = (hpitch - pitch);
		var xv = v;

		//function loopx() {
		for(sx = 0; sx < w; sx+=2) {
			var firstx = px;
			var firsty = py;
			var ly = h;
			//var z = 0;
			//var zbuf = [];
			//zbuf[h] = -1;
			var vacio = false;
			//var lsalt = h + ch;

			var sy = h + ch;

			var state = new DrawState(h);

			//function loopy() {
			while(sy >= 0) {
				var tv1 = ((((px >> 1) & 1023) + ((py >> 1) & 1023) * 1024) << 2);
				var tv2 = ((((px >> 2) & 1023) + ((py >> 2) & 1023) * 1024) << 2);
				//var alt = getPixel8(heightmap, (px>>2) & 1023, (py>>2) & 1023);
				var alt = heightmap.data[tv2];
				var tex;
				var zbuf 

				var salt = (sy - (alt/2))|0;

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
						//tex = getPixel24(texture, (px>>1) & 1023, (py>>1) & 1023);
						tex = [
							texture.data[tv1],
							texture.data[tv1+1],
							texture.data[tv1+2],
						]
					}
				}

				

				//v=drawSlab(llsalt, salt, tex, zbuf, z, v, pitch);

				//v=drawSlab(ly, salt, tex, zbuf, z, v, pitch);
				//if(ly > salt)
				//	ly = salt;

				if(!vacio && ly > salt) {
					//function paintslab() {

					var fade = 256 - alt;

					// textura2: la coordenada x se saca de px+py
					// la coordenada y de la altura (está invertida)
					var normal = ly - salt;
					if(normal > 4) {
						// renderizado con textura vertical (textura2)
						/*var prop = (normal-2) << 5;
						if(prop > 255) prop = 255;
						var iprop = (255-prop) * fade;
						prop *= fade;
						var pitch2 = texture2.width * BPP;
						var v2 = wrap(px + py, texture2.width) * BPP;
						v2 += pitch2 * (texture2.height - (alt-normal));
						var t = [0,0,0];
						var ftex0 = iprop*tex[0], ftex1 = iprop*tex[1], ftex2 = iprop*tex[2];

						while(ly > salt) {
							t[0] = (ftex0 + prop*texture2.data[v2])   >> 16;
							t[1] = (ftex1 + prop*texture2.data[v2+1]) >> 16;
							t[2] = (ftex2 + prop*texture2.data[v2+2]) >> 16;
							putPixel(v, t);
							v -= pitch;
							v2 -= pitch2;
							--ly;
						}*/

						var pitch2 = (texture2.width|0) * BPP;
						var v2 = wrap((px + py)|0, texture2.width|0) * BPP;
						v2 += pitch2 * (texture2.height - (alt-normal))|0;
						var t = [0,0,0];

						while(ly > salt) {
							t[0] = texture2.data[v2]   * fade >> 8;
							t[1] = texture2.data[v2+1] * fade >> 8;
							t[2] = texture2.data[v2+2] * fade >> 8;
							putPixel(v, t);
							v -= pitch;
							v2 -= pitch2;
							--ly;
						}

					}
					else {
						// renderizado normal

						tex[0] = (tex[0] * fade) >> 8;
						tex[1] = (tex[1] * fade) >> 8;
						tex[2] = (tex[2] * fade) >> 8;

						while(ly > salt) {
							putPixel(v, tex);
							v -= pitch;
							--ly;
						}
					}
					//}
					//paintslab();
				}
				else {
					v -= pitch * (ly - salt);
					ly = salt;
				}

				//if(salt == 0)
				//	break;
				px += cosy;
				py += siny;

				sy -= 1;
			}
			//}
			//loopy();

			px = firstx + cosx;
			py = firsty + sinx;

			xv = v = xv + (BPP<<1);
		}
		//}
		//loopx();

		//function dump() {
		ctx.putImageData(imageData, 0, 0);
		//}
		//dump();
	}
}
