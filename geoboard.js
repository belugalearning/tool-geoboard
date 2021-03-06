define(['band', 'constants'], function (Band, constants) {
    'use strict';

    var PropertyDisplays = constants['PropertyDisplays'];

    var Geoboard = cc.Class.extend({

        ctor: function () {

            this.background = new cc.Node();
            this.background.boundary = cc.RectMake(-300, -250, 600, 520);
            this.pins = [];
            this.bands = [];
            this.movingBand = null;

            this.angleDisplay = "none";
            this.sideDisplay = "none";

            this.pinNode = new cc.Node();
            this.background.addChild(this.pinNode);

            this.bandColours = [];
            var rgbValues = [75, 160, 245];
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    for (var k = 0; k < 3; k++) {
                        this.bandColours.push(cc.c3b(rgbValues[i], rgbValues[j], rgbValues[k]));
                    };
                };
            };
        },

        addPinsToBackground: function() {
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                this.pinNode.addChild(this.pins[i].sprite);
            };
        },

        addBand: function(band) {
            this.bands.push(band);
            this.background.addChild(band.bandNode);
            this.selectBand(band);
        },

        processTouch: function(touchLocation) {
            for (var i = 0; i < this.bands.length; i++) {
                this.bands[i].processTouch(touchLocation);
                if (this.movingBand !== null) {
                    break;
                };
            };
        },

        processMove: function(touchLocation) {
            if (this.movingBand !== null) {
                var touchLocationRelativeToBackground = this.background.convertToNodeSpace(touchLocation);
                this.movingBand.processMove(touchLocationRelativeToBackground);
                for (var i = 0; i < this.pins.length; i++) {
                    var pin = this.pins[i];
                    pin.highlightPin(pin.sprite.touchClose(touchLocation));
                };
            }
        },

        processEnd: function(touchLocation) {
            if (this.movingBand !== null) {
                var placedOnPin = false;
                for (var i = 0; i < this.pins.length; i++) {
                    var pin = this.pins[i];
                    pin.highlightPin(false);
                    if (pin.sprite.touchClose(touchLocation)) {
                        this.movingBand.pinBandOnPin(pin);
                        placedOnPin = true;
                        break;
                    };
                };
                if (!placedOnPin) {
                    this.movingBand.removeMovingPin();
                };
                this.movingBand.processEnd(touchLocation);
                this.groupSameAngles();
                this.groupSameSideLengths();
                this.groupParallelSides();
                this.setPropertyIndicatorsForSelectedBand();
                this.layer.displaySelectedProperty();
            };
            this.setAllDrawAngles();
            this.movingBand = null;
        },

        setMovingBand: function(band) {
            this.movingBand = band;
            this.selectBand(band);
        },

        setAllDrawAngles: function() {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                for (var j = 0; j < band.angles.length; j++) {
                    band.angles[j].setDrawAngle();
                };
            };
        },

        newBand: function() {
            var firstPin = this.pins[0];
            var secondPin = this.pins[1];
            var Band = require('band');
            var band = new Band();
            band.setupWithGeoboardAndPins(this, [firstPin, secondPin]);
            return band;
        },

        removeBand: function(index) {
            var band = this.bands[index];
            band.bandNode.removeFromParent();
            this.bands.splice(index, 1);
            this.layer.removeSelectBandButton(band);
            this.bandColours.push(band.colour);
            if (index === 0) {
                if (this.bands.length > 0) {
                    this.selectBand(this.bands[0]);
                } else {
                    this.selectNoBand();
                };
            };
            for (var i = 0; i < band.pins.length; i++) {
                var pin = band.pins[i];
            };
            this.groupSameAngles();
            this.groupSameSideLengths();
            this.groupParallelSides();

        },

        selectNoBand: function() {
            this.setPropertyIndicatorsForSelectedBand();
            this.layer.movePropertyButtonsOffscreen();
        },

        removeSelectedBand: function() {
            if (this.bands.length > 0) {
                this.removeBand(0);
            };
        },

        selectBand: function(band) {
            var previousBand;
            if (this.bands.length > 1) {
                previousBand = this.bands[0];
            } else {
                previousBand = null;
            }
            var index = this.bands.indexOf(band);
            this.bands.splice(index, 1);
            this.bands.splice(0, 0, band);
            this.setBandsZIndexToPriorityOrder();
            this.setPropertyIndicatorsForSelectedBand();
            this.layer.displaySelectedBand(band);
            if (this.layer.propertyDisplay === PropertyDisplays.AREA) {
                this.displayArea(true);
            };
        },

        selectBandFromButton: function(sender) {
            var band = sender.band;
            this.selectBand(band);        
        },

        setBandsZIndexToPriorityOrder: function() {
            for (var i = 1; i <= this.bands.length; i++) {
                var index = this.bands.length - i;
                var band = this.bands[index];
                this.background.reorderChild(band.bandNode, i);
            };
        },

        setAllProperties: function() {
            this.setPropertyIndicatorsForSelectedBand();
            this.groupSameAngles();
            this.groupSameSideLengths();
            this.groupParallelSides();
        },

        setPropertyIndicatorsForSelectedBand: function() {
            if (this.bands.length > 0) {
                var band = this.bands[0];
                this.layer.setRegularIndicatorWith(band.getRegular());
                this.layer.setShapeIndicatorWith(band.getShape());
                this.layer.setPerimeterIndicatorWith(band.getPerimeter());
                this.layer.setAreaIndicatorWith(band.getArea());
            } else {
                this.layer.setRegularIndicatorWith("");
                this.layer.setShapeIndicatorWith("");
                this.layer.setPerimeterIndicatorWith(null);
                this.layer.setAreaIndicatorWith(null);
            };
        },

/*
        toggleAngleDisplay = function(string) {
            if (this.angleDisplay === string) {
                this.angleDisplay = "none"
            } else {
                this.angleDisplay = string;
            };
            this.setupAngleDisplay();
        },
*/

        displayAngles: function(visible) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.angleNode.setVisible(visible);
                band.displaySameAngles(false);
            };
            this.setAllDrawAngles();
        },

        displaySameAngles: function(visible) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.angleNode.setVisible(visible);
                band.displaySameAngles(true);
            };
            this.setAllDrawAngles();
        },

/*
        setupAngleDisplay = function() {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                if (this.angleDisplay === "angleValues") {
                    band.angleNode.setVisible(true);
                    band.displaySameAngles(false)
                } else if (this.angleDisplay === "sameAngles") {
                    band.angleNode.setVisible(true);
                    band.displaySameAngles(true);
                } else {    
                    band.angleNode.setVisible(false);
                };
                for (var j = 0; j < band.angles.length; j++) {
                    band.angles[j].setDrawAngle();
                };
            };
            this.setAllDrawAngles();
        },
*/
/*
        toggleSideDisplay = function(string) {
            if (this.sideDisplay === string) {
                this.sideDisplay = "none";
            } else {
                this.sideDisplay = string;
            };
            this.setupSideDisplay();
        },
*/
        displaySideLengths: function(visible) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.sideLengthsNode.setVisible(visible);
            };
        },

        displaySameSideLengths: function(visible) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.sameSideLengthNotchesVisible(visible);
            };
        },

        displayParallelSides: function(visible) {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.parallelSideArrowsVisible(visible);
            };
        },

        displayArea: function(visible) {
            if (this.bands.length > 0) {
                var band = this.bands[0];
                band.areaNode.setVisible(visible);
                for (var i = 1; i < this.bands.length; i++) {
                    this.bands[i].areaNode.setVisible(false);
                };
            };
        },

/*
        setupSideDisplay = function() {
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.sideLengthsNode.setVisible(false);
                band.sameSideLengthNotchesVisible(false);
                band.parallelSideArrowsVisible(false);
                var sideDisplay = this.sideDisplay;
                if (sideDisplay === "sideLengthValues") {
                    band.sideLengthsNode.setVisible(true);
                } else if (sideDisplay === "sameSideLengths") {
                    band.sameSideLengthNotchesVisible(true);
                } else if (sideDisplay === "parallelSides") {
                    band.parallelSideArrowsVisible(true);
                }
            };
        },
*/
        groupSameAngles: function() {
            var angles = [];
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.setupAngles();
                angles = angles.concat(band.angles);
            };
            var numberOfArcs = 1;
            while(angles.length > 0) {
                var thisAngle = angles[0];
                var sameAngles = [];
                sameAngles.push(thisAngle);
                for (var i = 1; i < angles.length; i++) {
                    var otherAngle = angles[i];
                    if (Math.abs(thisAngle.throughAngle - otherAngle.throughAngle) < 0.0001) {
                        sameAngles.push(otherAngle);
                    };
                };
                if (sameAngles.length > 1) {
                    for (var i = 0; i < sameAngles.length; i++) {
                        var angle = sameAngles[i];
                        angle.numberOfArcs = numberOfArcs;
                        angle.setDrawAngle();
                    };
                    numberOfArcs++;
                };
                for (var i = 0; i < sameAngles.length; i++) {
                    var index = angles.indexOf(sameAngles[i]);
                    angles.splice(index, 1);
                };
            }

        },

        groupSameSideLengths: function() {
            var sides = [];
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i]
                band.clearSameSideLengthNotches();
                band.setupSideLengths();
                if (band.pins.length > 2) {
                    sides = sides.concat(band.bandParts);
                } else if (band.pins.length === 2) {
                    sides.push(band.bandParts[0]);
                };
            };
            var numberOfNotches = 1;
            while(sides.length > 0) {
                var thisSide = sides[0];
                var sameSideLengths = [];
                sameSideLengths.push(thisSide);
                for (var i = 1; i < sides.length; i++) {
                    var otherSide = sides[i];
                    if (Math.abs(thisSide.length() - otherSide.length()) < 0.0001) {
                        sameSideLengths.push(otherSide);
                    };
                };
                if (sameSideLengths.length > 1) {
                    for (var i = 0; i < sameSideLengths.length; i++) {
                        var side = sameSideLengths[i];
                        side.addNotches(numberOfNotches);
                    };
                    numberOfNotches++;
                };
                for (var i = 0; i < sameSideLengths.length; i++) {
                    var index = sides.indexOf(sameSideLengths[i]);
                    sides.splice(index, 1);
                };
            }
        },

        groupParallelSides: function() {
            var sides = [];
            for (var i = 0; i < this.bands.length; i++) {
                var band = this.bands[i];
                band.clearParallelSideArrows();
                if (band.pins.length > 2) {
                    sides = sides.concat(band.bandParts);
                } else if (band.pins.length === 2) {
                    sides.push(band.bandParts[0]);
                };
            };
            var numberOfArrows = 1;
            while(sides.length > 0) {
                var thisSide = sides[0];
                var parallelSidesSameOrientation = [];
                var parallelSidesReverseOrientation = [];
                parallelSidesSameOrientation.push(thisSide);
                for (var i = 1; i < sides.length; i++) {
                    var otherSide = sides[i];
                    if (thisSide.parallelTo(otherSide)) {
                        if (Math.abs(thisSide.bandPartNode.getRotation() - otherSide.bandPartNode.getRotation()) < 0.0001) {
                            parallelSidesSameOrientation.push(otherSide);
                        } else {
                            parallelSidesReverseOrientation.push(otherSide);
                        };
                    };
                };
                if (parallelSidesSameOrientation.length + parallelSidesReverseOrientation.length > 1) {
                    for (var i = 0; i < parallelSidesSameOrientation.length; i++) {
                        parallelSidesSameOrientation[i].addArrows(numberOfArrows, true);
                    };
                    for (var i = 0; i < parallelSidesReverseOrientation.length; i++) {
                        parallelSidesReverseOrientation[i].addArrows(numberOfArrows, false);
                    };
                    numberOfArrows++;
                };
                for (var i = 0; i < parallelSidesSameOrientation.length; i++) {
                    var index = sides.indexOf(parallelSidesSameOrientation[i]);
                    sides.splice(index, 1);
                };
                for (var i = 0; i < parallelSidesReverseOrientation.length; i++) {
                    var index = sides.indexOf(parallelSidesReverseOrientation[i]);
                    sides.splice(index, 1);
                };
            }
        }
    });

    return Geoboard;

});

