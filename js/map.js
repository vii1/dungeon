"use strict";

var CELL_SIZE = 32;

var CellType = {
	VOID: 0,
	FLOOR: 1,
	VOXEL: 2
}
if(Object.freeze)
	Object.freeze(CellType);

function Map(cellsx, cellsy) {
	cellsx = cellsx|0;
	cellsy = cellsy|0;

	assert(cellsx > 0 && cellsy > 0, "Dimensiones de mapa incorrectas");

	var numcells = cellsx * cellsy;

	this.cellsx = cellsx;

	this.cellsy = cellsy;
	
	this.version = Map.VERSION;

	this.cellMap = [];
	for(var i=0; i < numcells; ++i) {
		this.cellMap[i] = { type: CellType.VOID };
	}

	// Las texturas son nombres de textureList.json
	this.textures = [];

	// Al cargar el mapa, se crea en cada celda de la cellMap una lista con las entidades contenidas
	// en cada celda. Esta lista se actualiza cada vez que la entidad se mueve.
	this.entities = [];

	this.init = function() {
		var numents = this.entities.length;
		for(var i=0; i < numents; ++i) {
			var ent = this.entities[i];
			assert(ent.x >= 0 && ent.y >= 0 && (ent.x / CELL_SIZE)|0 < cellsx && (ent.y / CELL_SIZE)|0 < cellsy, "Entidad #"+i+" fuera de límites del mapa");
		}

		for(var i=0; i < numcells; ++i) {
			var celda = this.cellMap[i];
			if(celda.type != CellType.VOID) {
			}
		}
	}
}

Map.VERSION = 1;

Map.voidCell = function() {
	return { type: CellType.VOID };
}

Map.floorCell = function(height, texture) {
	return {
		type: CellType.FLOOR,
		height: height || 0,
		texture: texture || 0
	};
}

// TODO: minHeight, maxHeight
Map.voxelCell = function(voxelData) {
	return {
		type: cellType.VOXEL,
		voxelData: voxelData
	};
}
