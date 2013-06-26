function Geoboard() {
    this.background = new cc.Node();
    this.background.boundary = cc.RectMake(-300, -250, 600, 520);
    this.pins = new Array();
    this.bands = new Array();
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

    this.addPinsToBackground = function() {
        for (var i = 0; i < this.pins.length; i++) {
            var pin = this.pins[i];
            this.pinNode.addChild(this.pins[i].sprite);
        };
    }

    this.addBand = function(band) {
        this.bands.push(band);
        this.background.addChild(band.bandNode);
        this.selectBand(band);
    }

    this.processTouch = function(touchLocation) {
        for (var i = 0; i < this.bands.length; i++) {
            this.bands[i].processTouch(touchLocation);
            if (this.movingBand !== null) {
                break;
            };
        };
    }

    this.processMove = function(touchLocation) {
        if (this.movingBand !== null) {
            var touchLocationRelativeToBackground = this.background.convertToNodeSpace(touchLocation);
            this.movingBand.processMove(touchLocationRelativeToBackground);
            for (var i = 0; i < this.pins.length; i++) {
                var pin = this.pins[i];
                pin.highlightPin(pin.sprite.touchClose(touchLocation));
            };
        }
    }

    this.processEnd = function(touchLocation) {
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
    }

    this.setMovingBand = function(band) {
        this.movingBand = band;
        this.selectBand(band);
    }

    this.setAllDrawAngles = function() {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            for (var j = 0; j < band.angles.length; j++) {
                band.angles[j].setDrawAngle();
            };
        };
    }

    this.newBand = function() {
        var firstPin = this.pins[0];
        var secondPin = this.pins[1];
        var band = new Band();
        band.setupWithGeoboardAndPins(this, [firstPin, secondPin]);
        return band;
    }

    this.removeBand = function(index) {
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

    }

    this.selectNoBand = function() {
        this.setPropertyIndicatorsForSelectedBand();
        this.layer.movePropertyButtonsOffscreen();
    }

    this.removeSelectedBand = function() {
        if (this.bands.length > 0) {
            this.removeBand(0);
        };
    }

    this.selectBand = function(band) {
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
    }

    this.selectBandFromButton = function(sender) {
        var band = sender.band;
        this.selectBand(band);        
    }

    this.setBandsZIndexToPriorityOrder = function() {
        for (var i = 1; i <= this.bands.length; i++) {
            var index = this.bands.length - i;
            var band = this.bands[index];
            this.background.reorderChild(band.bandNode, i);
        };
    }

    this.setAllProperties = function() {
        this.setPropertyIndicatorsForSelectedBand();
        this.groupSameAngles();
        this.groupSameSideLengths();
        this.groupParallelSides();
    }

    this.setPropertyIndicatorsForSelectedBand = function() {
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
    }

    /*this.toggleAngleDisplay = function(string) {
        if (this.angleDisplay === string) {
            this.angleDisplay = "none"
        } else {
            this.angleDisplay = string;
        };
        this.setupAngleDisplay();
    }*/

    this.displayAngles = function(visible) {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            band.angleNode.setVisible(visible);
            band.displaySameAngles(false);
        };
        this.setAllDrawAngles();
    };

    this.displaySameAngles = function(visible) {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            band.angleNode.setVisible(visible);
            band.displaySameAngles(true);
        };
        this.setAllDrawAngles();
    };

/*    this.setupAngleDisplay = function() {
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
    }
*/
/*    this.toggleSideDisplay = function(string) {
        if (this.sideDisplay === string) {
            this.sideDisplay = "none";
        } else {
            this.sideDisplay = string;
        };
        this.setupSideDisplay();
    }
*/
    this.displaySideLengths = function(visible) {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            band.sideLengthsNode.setVisible(visible);
        };
    }

    this.displaySameSideLengths = function(visible) {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            band.sameSideLengthNotchesVisible(visible);
        };
    }

    this.displayParallelSides = function(visible) {
        for (var i = 0; i < this.bands.length; i++) {
            var band = this.bands[i];
            band.parallelSideArrowsVisible(visible);
        };
    }

    this.displayArea = function(visible) {
        if (this.bands.length > 0) {
            var band = this.bands[0];
            band.areaNode.setVisible(visible);
            for (var i = 1; i < this.bands.length; i++) {
                this.bands[i].areaNode.setVisible(false);
            };
        };
    };

/*    this.setupSideDisplay = function() {
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
    }
*/
    this.groupSameAngles = function() {
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

    }

    this.groupSameSideLengths = function() {
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
    }

    this.groupParallelSides = function() {
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
}

function SquareGeoboard() {
    RegularGeoboard.call(this);
    this.angleBetweenAxes = Math.PI/2;
}


function RegularGeoboard() {
    Geoboard.call(this);

    this.distanceBetweenPins = 70;
    this.unitDistance = this.distanceBetweenPins;



    this.setupPins = function () {
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
    }

    this.pinPosition = function(i, j) {
        var xValue = this.background.boundary.origin.x + this.distanceBetweenPins * (i + this.rowOffset * j);
        var yValue = this.background.boundary.origin.y + this.distanceBetweenPins * this.rowHeight * j;
        var pinPosition = cc.p(xValue, yValue);
        return pinPosition;
    }

    this.positionOnBackground = function(pinPosition) {
        var xRelativeToBackground = pinPosition.x + this.background.boundary.origin.x;
        var yRelativeToBackground = pinPosition.y + this.background.boundary.origin.y;
        var pinPositionRelativeToBackground= cc.p(xRelativeToBackground, yRelativeToBackground);
        var background = this.background;
        var boundary = this.background.boundary;
        var onBackground = cc.rectContainsPoint(boundary, pinPosition);
        return onBackground;
    }

}

function TriangleGeoboard() {
    RegularGeoboard.call(this);
    this.angleBetweenAxes = Math.PI/3;
}

function CircleGeoboard(numberOfPins, includeCentre) {
    Geoboard.call(this);
    this.radius = 250;
    this.numberOfPins = numberOfPins;
    this.includeCentre = includeCentre;
    var contentSize = this.background.getContentSize();
    this.centreOfCircle = cc.p(contentSize.width/2, contentSize.height/2);
    this.unitDistance = this.radius;

    this.setupPins = function() {
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
    }

    this.edgePinPosition = function(index) {
        var xPosition = this.centreOfCircle.x + this.radius * Math.sin(2 * Math.PI * index/this.numberOfPins);
        var yPosition = this.centreOfCircle.y + this.radius * Math.cos(2 * Math.PI * index/this.numberOfPins);
        return cc.p(xPosition, yPosition);
    }

    this.addCentrePin = function() {
        this.includeCentre = true;
        var pin = new Pin();
        pin.circlePinIndex = 0;
        pin.sprite.setPosition(this.centreOfCircle)
        this.background.addChild(pin.sprite);
        this.pins.splice(0, 0, pin);
    }

    this.removeCentrePin = function() {
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
    }

    this.removeDeletedPinFromBands = function(pinToDelete) {
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
    }

    this.addEdgePin = function() {
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
    }

    this.removeEdgePin = function() {
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
    }

    this.positionEdgePins = function() {
        for (var i = 0; i < this.pins.length; i++) {
            var pin = this.pins[i];
            var circleIndex = pin.circlePinIndex;
            if (circleIndex !== 0) {
                var position = this.edgePinPosition(circleIndex - 1);
                pin.sprite.setPosition(position);
            }; 
        };
    }
}

var setupInheritances = function() {
    inherits(RegularGeoboard, Geoboard);
    inherits(SquareGeoboard, RegularGeoboard);
    inherits(TriangleGeoboard, RegularGeoboard);
    inherits(CircleGeoboard, Geoboard);
}

