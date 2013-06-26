define(['regulargeoboard'], function (RegularGeoboard) {
    'use strict';

    var TriangleGeoboard = RegularGeoboard.extend({

        ctor: function () {

        	this._super();
            this.angleBetweenAxes = Math.PI/3;
        }

    });

    return TriangleGeoboard;

});
