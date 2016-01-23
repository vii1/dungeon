"use strict";

var Key = (function() {
	var pressed = {};
	var lasttime = 0;

	return {
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		G: 71,
		H: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,

		// Detecta repetición, no 1 pulsación
		isJustDown: function(keyCode) {
			var p = pressed[keyCode];
			if(p == lasttime) {
				lasttime = 0;
				return p;
			}
			else
				return false;
		},

		isDown: function(keyCode) {
			return pressed[keyCode]||false;
		},

		onKeyDown: function(event) {
			lasttime = pressed[event.keyCode] = Date.now();
		},

		onKeyUp: function(event) {
			pressed[event.keyCode] = false;
		}
	};
})();

var Mouse = (function() {
	var pressed = {};
	var lasttime = 0;
	var x, y;
	var over = false;

	return {
		LEFT: 0,
		MIDDLE: 1,
		RIGHT: 2,

		isDown: function(button) {
			return pressed[button] || false;
		},

		isOver: function() {
			return over;
		},

		getPosition: function() {
			return {x: x, y: y};
		},

		onMouseDown: function(event) {
			x = event.offsetX;
			y = event.offsetY;
			lasttime = pressed[event.button] = Date.now();
			over = true;
		},

		onMouseUp: function(event) {
			x = event.offsetX;
			y = event.offsetY;
			pressed[event.button] = 0;
			over = true;
		},

		onContextMenu: function(event) {
			event.preventDefault();
			return false;
		},

		onMouseMove: function(event) {
			x = event.offsetX;
			y = event.offsetY;
			over = true;
		},

		onMouseOver: function() {
			over = true;
		},

		onMouseOut: function() {
			over = false;
		}
	};
})();