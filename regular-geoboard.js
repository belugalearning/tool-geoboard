define(['geoboard', 'pin'], function (Geoboard, Pin) {
    'use strict';

    var RegularGeoboard = Geoboard.extend({

        ctor: function () {

            this._super();
            this.distanceBetweenPins = 70;
            this.unitDistance = this.distanceBetweenPins;

        },

        setupPins: function () {
            var firstCoordinate = 0;
            var secondCoordinate = 0;
            this.rowHeight = Math.sin(this.angleBetweenAxes);
            this.rowOffset = Math.cos(this.angleBetweenAxes);
            while (this.positionOnBackground(this.pinPosition(0, secondCoordinate))) {
                while (this.positionOnBackground(this.pinPosition(firstCoordinate, secondCoordinate))) {
                    var pin = new Pin();
                    pin.sprite.setPosition(this.pinPosition(firstCoordinate, secondCoordinate));
                    this.pins.push(pin);
                    firstCoordinate++;
                }
                firstCoordinate = -1;
                while (this.positionOnBackground(this.pinPosition(firstCoordinate, secondCoordinate))) {
                    var pin = new Pin();
                    pin.sprite.setPosition(this.pinPosition(firstCoordinate, secondCoordinate));
                    this.pins.push(pin);
                    firstCoordinate--;
                }
                firstCoordinate = 0;
                secondCoordinate++;
            }

            this.addPinsToBackground();
        },

        pinPosition: function(i, j) {
            var xValue = this.background.boundary.origin.x + this.distanceBetweenPins * (i + this.rowOffset * j);
            var yValue = this.background.boundary.origin.y + this.distanceBetweenPins * this.rowHeight * j;
            var pinPosition = cc.p(xValue, yValue);
            return pinPosition;
        },

        positionOnBackground: function(pinPosition) {
            var xRelativeToBackground = pinPosition.x + this.background.boundary.origin.x;
            var yRelativeToBackground = pinPosition.y + this.background.boundary.origin.y;
            var pinPositionRelativeToBackground= cc.p(xRelativeToBackground, yRelativeToBackground);
            var background = this.background;
            var boundary = this.background.boundary;
            var onBackground = cc.rectContainsPoint(boundary, pinPosition);
            return onBackground;
        }

    });

    return RegularGeoboard;

});
