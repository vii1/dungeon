// Esto promete pero hay bastantes glitches y mucho overdraw
// Quiero intentar mejorar el backface culling, puede que el backtracking sea
// inevitable pero quiero tener un buffer que me indique dónde he dibujado ya

function Mode6() {

	var RAD = Math.PI / 180.0;
	var BPP = 4;
	var SQR2 = Math.sqrt(2);

	var canvas;
	var ctx;
	var imageData;
	var w, h;

	var texture = null;
	var heightmap = null;

	function drawSlab(yfrom, yto, color, zbuf, z, v, pitch) {		
		/*if(yfrom > h)
			yfrom = h;
		--yfrom;
		if(yfrom < yto)
			return;*/
		var v = (w*yfrom+sx)*BPP;
		while(yfrom > yto) {
			//if((!zbuf[yfrom]) || zbuf[yfrom] > z) {
				imageData.data[v] = color[0];
				imageData.data[v+1] = color[1];
				imageData.data[v+2] = color[2];
				imageData.data[v+3] = 255;
				imageData.data[v+4] = color[0];
				imageData.data[v+5] = color[1];
				imageData.data[v+6] = color[2];
				imageData.data[v+7] = 255;
				//zbuf[yfrom] = z;
			//}
			v -= pitch;
			--yfrom;
		}
		//return v;
	}

	/*function drawSlab(ly, salt, tex, zbuf, z, v, pitch) {
		while(ly > salt) {
			imageData.data[v] = tex[0];
			imageData.data[v+1] = tex[1];
			imageData.data[v+2] = tex[2];
			imageData.data[v+3] = 255;
			imageData.data[v+4] = tex[0];
			imageData.data[v+5] = tex[1];
			imageData.data[v+6] = tex[2];
			imageData.data[v+7] = 255;
			v -= pitch;
			--ly;
		}
		return v;
	}*/

	this.init = function(_canvas) {
		canvas = _canvas;
		ctx = canvas.getContext('2d');
		imageData = ctx.createImageData(canvas.width, canvas.height);
		w = canvas.width;
		h = canvas.height;
	}

	this.setMaps = function (_texture, _heightmap) {
		texture = getImageData(_texture);
		heightmap = getImageData(_heightmap);
	}

	this.draw = function(camera) {
		/*ctx.setFillColor('black');
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.createImageData(w, h);*/
		var cosy = Math.cos(camera.angle * RAD)*SQR2;
		var siny = Math.sin(camera.angle * RAD)*SQR2;
		var cosx = Math.cos(wrapAngle(camera.angle - 90) * RAD);
		var sinx = Math.sin(wrapAngle(camera.angle - 90) * RAD);

		var ch = camera.h;
		var cx = camera.x;
		var cy = camera.y;

		var sx, sy;

		var px = cx - (cosx * w / 2);
		var py = cy - (sinx * w / 2);

		var pitch = w * BPP;
		var hpitch = h * pitch;

		var v = hpitch - pitch;
		var xv = v;

		for(sx = 0; sx < w; sx+=2) {
			var firstx = px;
			var firsty = py;
			var ly = h;
			var z = 0;
			var zbuf = [];
			//zbuf[h] = -1;
			var vacio = false;
			var lsalt = h + ch;

			for(sy = h + ch; sy >= 0; sy-=2, z+=2) {
				var alt = getPixel8(heightmap, wrap(px/2, heightmap.width), wrap(py/2, heightmap.height));
				var tex = getPixel24(texture, wrap(px/2, texture.width), wrap(py/2, texture.height));	

				var salt = parseInt(sy - (alt/2));

				if(alt == 255) {
					vacio = true;
					px += cosy*2;
					py += siny*2;
					continue;
				}
				else {
					if(vacio) {
						while(ly > sy) {
							imageData.data[v] =   0;
							imageData.data[v+1] = 0;
							imageData.data[v+2] = 0;
							imageData.data[v+3] = 255;
							imageData.data[v+4] = 0;
							imageData.data[v+5] = 0;
							imageData.data[v+6] = 0;
							imageData.data[v+7] = 255;
							v -= pitch;
							--ly;
						}
					}
					if(salt > ly) {
						v += pitch * (salt - ly);
						//sy = salt+2;
						//ly = sy > h ? h : sy;
						ly = salt;
						px += cosy*2;
						py += siny*2;
						continue;
					}
					else if(vacio) {
						while(ly > salt+1) {
							imageData.data[v] =   0;
							imageData.data[v+1] = 0;
							imageData.data[v+2] = 0;
							imageData.data[v+3] = 255;
							imageData.data[v+4] = 0;
							imageData.data[v+5] = 0;
							imageData.data[v+6] = 0;
							imageData.data[v+7] = 255;
							v -= pitch;
							--ly;
						}
						vacio = false;
					}
				}
				lsalt = salt;

				if(salt < 0)
					salt = 0;

				//v=drawSlab(llsalt, salt, tex, zbuf, z, v, pitch);

				//v=drawSlab(ly, salt, tex, zbuf, z, v, pitch);
				//if(ly > salt)
				//	ly = salt;

				while(ly > salt) {
					imageData.data[v] = tex[0];
					imageData.data[v+1] = tex[1];
					imageData.data[v+2] = tex[2];
					imageData.data[v+3] = 255;
					imageData.data[v+4] = tex[0];
					imageData.data[v+5] = tex[1];
					imageData.data[v+6] = tex[2];
					imageData.data[v+7] = 255;
					v -= pitch;
					--ly;
				}

				if(salt == 0)
					break;

				px += cosy*2;
				py += siny*2;
			}

			if(vacio) {
				while(ly > 0) {
					imageData.data[v] =   0;
					imageData.data[v+1] = 0;
					imageData.data[v+2] = 0;
					imageData.data[v+3] = 255;
					imageData.data[v+4] = 0;
					imageData.data[v+5] = 0;
					imageData.data[v+6] = 0;
					imageData.data[v+7] = 255;
					v -= pitch;
					--ly;
				}
			}

			px = firstx + cosx*2;
			py = firsty + sinx*2;
			xv = v = xv + BPP*2;
		}

		ctx.putImageData(imageData, 0, 0);
	}
}
