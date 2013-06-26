define(['regulargeoboard'], function (RegularGeoboard) {
    'use strict';

    function TriangleGeoboard() {
        RegularGeoboard.call(this);
        this.angleBetweenAxes = Math.PI/3;
    }


    return TriangleGeoboard;

});
