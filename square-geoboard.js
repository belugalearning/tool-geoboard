define(['regulargeoboard'], function (RegularGeoboard) {
    'use strict';

    function SquareGeoboard() {
        RegularGeoboard.call(this);
        this.angleBetweenAxes = Math.PI/2;
    }

    return SquareGeoboard;

});
