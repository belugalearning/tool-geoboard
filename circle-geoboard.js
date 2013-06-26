define(['geoboard', 'pin'], function (Geoboard, Pin) {
    'use strict';

    var CircleGeoboard = Geoboard.extend({

        ctor: function (numberOfPins, includeCentre) {

            this._super();
            this.radius = 250;
            this.numberOfPins = numberOfPins;
            this.includeCentre = includeCentre;
            var contentSize = this.background.getContentSize();
            this.centreOfCircle = cc.p(contentSize.width/2, contentSize.height/2);
            this.unitDistance = this.radius;

        },

        setupPins: function() {
            if (this.includeCentre) {
                var pin = new Pin();
                pin.circlePinIndex = 0;
                pin.sprite.setPosition(this.centreOfCircle);
                this.pins.push(pin);
            }
            for (var i = 0; i < this.numberOfPins; i++) {
                var pin = new Pin();
                pin.circlePinIndex = i + 1;
                pin.sprite.setPosition(this.edgePinPosition(pin.circlePinIndex - 1));
                this.pins.push(pin);
            }
            this.addPinsToBackground();
        },

        edgePinPosition: function(index) {
            var xPosition = this.centreOfCircle.x + this.radius * Math.sin(2 * Math.PI * index/this.numberOfPins);
            var yPosition = this.centreOfCircle.y + this.radius * Math.cos(2 * Math.PI * index/this.numberOfPins);
            return cc.p(xPosition, yPosition);
        },

        addCentrePin: function() {
            this.includeCentre = true;
            var pin = new Pin();
            pin.circlePinIndex = 0;
            pin.sprite.setPosition(this.centreOfCircle)
            this.background.addChild(pin.sprite);
            this.pins.splice(0, 0, pin);
        },

        removeCentrePin: function() {
            this.includeCentre = false;
            var pinToDelete;
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                if (pin.circlePinIndex === 0) {
                    pinToDelete = pin;
                    this.pins.splice(i, 1);
                    break;
                }
            };
            this.removeDeletedPinFromBands(pinToDelete);
            pinToDelete.sprite.removeFromParent();
        },

        removeDeletedPinFromBands: function(pinToDelete) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                for (var j = band.pins.length - 1; j >= 0; j--) {
                    var pin = band.pins[j];
                    if (pin === pinToDelete) {
                        band.pins.splice(j, 1);
                    }
                };
                if (band.pins.length === 0) {
                    this.removeBand(i);
                };
                band.setupBandParts();
                band.setupAngles();
                band.setupSideLengths();
                band.setDrawArea();
            };
        },

        addEdgePin: function() {
            this.numberOfPins++;
            var pin = new Pin();
            pin.circlePinIndex = this.numberOfPins;
            this.pins.push(pin);
            this.background.addChild(pin.sprite);
            this.positionEdgePins();
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.setPositionAndRotationOfBandParts();
                band.cleanPins();
                band.setupAngles();
                band.setupSideLengths();
                band.dirtyProperties = true;
                band.setDrawArea();
            };
            this.groupSameAngles();
            this.groupSameSideLengths();
            this.groupParallelSides();
            this.setPropertyIndicatorsForSelectedBand();
        },

        removeEdgePin: function() {
            var pinToDelete;
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                if (pin.circlePinIndex === this.numberOfPins) {
                    pinToDelete = pin;
                    this.pins.splice(i, 1);
                    break;
                };
            };
            this.numberOfPins--;
            this.positionEdgePins();
            this.removeDeletedPinFromBands(pinToDelete);
            pinToDelete.sprite.removeFromParent();
            this.groupSameAngles();
            this.groupSameSideLengths();
            this.groupParallelSides();
            this.setPropertyIndicatorsForSelectedBand();
            for (var i = 0; i < this.bands.length; i++) {
                this.bands[i].dirtyProperties = true;
                this.bands[i].setDrawArea();
            };
        },

        positionEdgePins: function() {
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                var circleIndex = pin.circlePinIndex;
                if (circleIndex !== 0) {
                    var position = this.edgePinPosition(circleIndex - 1);
                    pin.sprite.setPosition(position);
                }; 
            };
        }
    });

    return CircleGeoboard;

});
