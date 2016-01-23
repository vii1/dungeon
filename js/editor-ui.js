"use strict";

function makeCollapsablePanels(selParent, selHeaders) {
	$(selParent)
		.addClass('ui-accordion ui-widget ui-helper-reset')
		.children(selHeaders)
			.addClass('ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-accordion-header-active ui-state-active ui-corner-top')
			.prepend('<span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-s"></span>')
			.click(function() {
				var panel = $(this).next();
				if(panel.is(':visible')) {
					panel.slideUp();
					$(this)
						.removeClass('ui-accordion-header-active ui-state-active ui-corner-top')
						.addClass('ui-corner-all')
						.children('span:first')
							.removeClass('ui-icon-triangle-1-s')
							.addClass('ui-icon-triangle-1-e')
					;
				} else {
					panel.slideDown();
					$(this)
						.removeClass('ui-corner-all')
						.addClass('ui-accordion-header-active ui-state-active ui-corner-top')
						.children('span:first')
							.removeClass('ui-icon-triangle-1-e')
							.addClass('ui-icon-triangle-1-s')
					;
				}
				return false;
			})
			.next()
				.addClass('ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom')
	;
}

$(function() {
	$('#tabpanel').tabs();
	makeCollapsablePanels('#tab-mapa', 'h3');
	$('#tab-mapa button').button();
	$('#tipodecelda').buttonset();

	$('#mostrar-rejilla').click(function() {
		mode6.showGrid = this.checked;
	});
	$('#mostrar-ejes').click(function() {
		editor.showAxis = this.checked;
	});
	
	$('canvas').focus();
});
