define(['regulargeoboard'], function (RegularGeoboard) {
    'use strict';

    var SquareGeoboard = RegularGeoboard.extend({

        ctor: function () {

        	this._super();
            this.angleBetweenAxes = Math.PI/2;

        }

    });

    return SquareGeoboard;

});
