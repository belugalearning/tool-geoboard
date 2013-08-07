define(['geoboard', 'pin'], function (Geoboard, Pin) {
    'use strict';

    var RegularGeoboard = Geoboard.extend({

        ctor: function () {

            this._super();
            this.distanceBetweenPins = 70;
            this.unitDistance = this.distanceBetweenPins;

        },

        setupPins: function () {
            var latticePoints = this.background.boundary.latticePoints(this.distanceBetweenPins, this.distanceBetweenPins, this.angleBetweenAxes, 0, 0);
            for (var i = 0; i < latticePoints.length; i++) {
                var pin = new Pin();
                pin.sprite.setPosition(latticePoints[i]);
                this.pins.push(pin);
            };
            this.addPinsToBackground();
        },
    });

    return RegularGeoboard;

});
