define(['angle', 'bandpart', 'geoboard', 'pin', 'constants'], function (Angle, BandPart, Geoboard, Pin, constants) {
    'use strict';

    var PropertyDisplays = constants['PropertyDisplays'];

    function Band() {

        this.bandNode = new cc.Node();
        this.bandPartsNode = new cc.Node();
        this.bandNode.addChild(this.bandPartsNode);
        this.areaNode = new cc.DrawNode();
        this.areaNode.setZOrder(-1);
        this.bandNode.addChild(this.areaNode);
        this.bandParts = new Array();
        this.movingPin = null;
        this.sideLengthsLabels = new Array();
        this.singleBandPart = null;

        this.dirtyProperties = true;
        this.regular = null;
        this.shape = null;
        this.perimeter = null;
        this.area = null;

    /*
        var red = 0, green = 0, blue = 0;
        while (red + green + blue < 256) {
            red = Math.floor(Math.random() * 256);
            green = Math.floor(Math.random() * 256);
            blue = Math.floor(Math.random() * 256);
        }
        this.colour = cc.c4f(red, green, blue, 255);
    */

        this.setupWithGeoboardAndPins = function(geoboard, pins) {
            this.geoboard = geoboard;
            this.pins = pins;
            this.bandParts = new Array();

            var randomIndex = Math.floor(Math.random() * this.geoboard.bandColours.length);
            this.colour = this.geoboard.bandColours[randomIndex];
            this.geoboard.bandColours.splice(randomIndex, 1);

            this.geoboard.addBand(this);
            this.setupBandParts();
            this.setupPropertiesNode();

            if (this.geoboard.layer) {
                this.areaNode.setVisible(this.geoboard.layer.propertyDisplay === PropertyDisplays.AREA);
            };
        }

        this.setupBandParts = function() {
            this.bandParts = [];
            this.bandPartsNode.removeAllChildren();
            if (this.pins.length > 1) {
                for (var i = 0; i < this.pins.length; i++) {
                    var fromPin = this.pins[i];
                    var toPin = this.pins.indexWraparound(i+1);
                    this.addBandPartBetween(fromPin, toPin);
                };
                this.setPositionAndRotationOfBandParts();
            } else if (this.pins.length === 1 && this.singleBandPart === null) {
                var pin = this.pins[0];
                this.singleBandPart = new cc.Sprite();
                this.singleBandPart.initWithFile(s_single_band_part);
                this.singleBandPart.setColor(this.colour);
                // this.singleBandPart.setPosition(pin.sprite.getPosition());
                this.singleBandPart.setPosition(cc.pAdd(pin.sprite.getPosition(), cc.p(0, 3)));
                this.bandNode.addChild(this.singleBandPart);
                var dummyPin = new NoShadowPin();
                dummyPin.sprite.setPosition(this.singleBandPart.getAnchorPointInPoints());
                this.singleBandPart.addChild(dummyPin.sprite);
            };
        }

        this.addBandPartBetween = function(fromPin, toPin) {
            var bandPart = new BandPart();
            bandPart.setup(this, fromPin, toPin);
            bandPart.sprite.setColor(this.colour);
            this.bandPartsNode.addChild(bandPart.baseNode);
            this.bandParts.push(bandPart);
            return bandPart;
        }

        this.setPositionAndRotationOfBandParts = function() {
            for (var i = 0; i < this.bandParts.length; i++) {
                this.bandParts[i].setPositionAndRotation();
            };
        }

        this.setupPropertiesNode = function() {
            this.propertiesNode = new cc.Node();
            this.propertiesNode.setZOrder(1);
            this.bandNode.addChild(this.propertiesNode);

            this.angleNode = new cc.Node();
            var angleNodeVisible = this.geoboard.angleDisplay === "none" ? false : true;
            this.angleNode.setVisible(angleNodeVisible);
            this.angles = new Array();
            this.propertiesNode.addChild(this.angleNode);
            this.setupAngles();

            this.sideLengthsNode = new cc.Node();
            this.propertiesNode.addChild(this.sideLengthsNode);
            this.sideLengthsNode.setVisible(false);
            this.setupSideLengths();

            this.sameSideLengthNotches = new Array();
            this.geoboard.groupSameSideLengths()

            this.parallelSideArrows = new Array();
            this.geoboard.groupParallelSides();
        }

        this.processTouch = function(touchLocation) {
            var selected = false;
            
            if (this.pins.length === 1) {
                if (this.singleBandPart.touched(touchLocation)) {
                    this.singleBandPart.removeFromParent();
                    this.singleBandPart = null;
                    this.splitBandPart(0, touchLocation);
                    selected = true;
                    this.geoboard.setMovingBand(this);
                };
            } else if (this.pins.length > 1) {
                for (var i = 0; i < this.pins.length; i++) {
                    var pin = this.pins[i];
                    if (pin.sprite.touched(touchLocation)) {
                        this.unpinBandFromPin(i);
                        selected = true;
                        this.geoboard.setMovingBand(this);
                        break;
                    };
                };
            };
            
            if (!selected) {
                for (var i = 0; i < this.bandParts.length; i++) {
                    var bandPart = this.bandParts[i];

    /*                
                    The following is a hack, the _transform property of the bandParts is being calculated incorrectly due to their rotation 
                    (the transform is reflected in the x axis from the fromPin of the bandPart) resulting in the sprites incorrectly 
                    detecting touches.
                    These lines ensure the point passed in to touched() will give the correct touch detection, but the cause for this 
                    behaviour should be found. The corresponding code in the objective C version of this app gives the correct transform. 
    */
                    var bandPartX = this.geoboard.background.convertToWorldSpace(bandPart.bandPartNode.getPosition()).x;
                    var difference = (touchLocation.x - bandPartX);
                    var touchLocationXCorrected = bandPartX - (difference);
                    var touchLocationCorrected = cc.p(touchLocationXCorrected, touchLocation.y);
                    if (bandPart.sprite.touched(touchLocationCorrected)) {
                        this.splitBandPart(i, touchLocation);
                        this.geoboard.setMovingBand(this);
                        selected = true;
                        break;
                    };
                };
            };
            if (selected) {
                this.setupBandParts();
                this.setupAngles();
                this.setupSideLengths();
                this.setDrawArea();
            };
        }

        this.unpinBandFromPin = function(index) {
            var pin = this.pins[index];
            this.movingPin = new MovingPin();
            var thing = this.bandPartsNode.getZOrder();
            this.movingPin.sprite.setZOrder(1);
            this.movingPin.sprite.setPosition(pin.sprite.getPosition());
            this.pins.splice(index, 1, this.movingPin);
            this.bandNode.addChild(this.movingPin.sprite);
        }

        this.splitBandPart = function(index, touchLocation) {
            this.movingPin = new MovingPin();
            var pinPosition = this.bandNode.convertToNodeSpace(touchLocation);
            this.movingPin.sprite.setZOrder(1);
            this.movingPin.sprite.setPosition(pinPosition);
            this.bandNode.addChild(this.movingPin.sprite);
            this.pins.splice(index + 1, 0, this.movingPin);
        }

        this.processMove = function(touchLocation) {
            this.movingPin.sprite.setPosition(touchLocation);
            this.setPositionAndRotationOfBandParts();
            this.setAngleValues();
            this.setSideLengthValues();
            this.setDrawArea();
        }

        this.processEnd = function(touchLocation) {
            this.movingPin.sprite.removeFromParent();
            this.movingPin = null;
            this.setupBandParts();
            this.setPositionAndRotationOfBandParts();
            this.setupAngles();
            this.cleanPins();
            this.geoboard.setAllProperties();
            this.setDrawArea();
        }

        this.pinBandOnPin = function(pin) {
            var movingPinIndex = this.pins.indexOf(this.movingPin);
            this.pins.splice(movingPinIndex, 1, pin);
            this.dirtyProperties = true;
            pin.highlightPin(false);
        }

        this.removeMovingPin = function() {
            var index = this.pins.indexOf(this.movingPin);
            this.removePin(index);
            this.movingPin.sprite.removeFromParent();
            this.dirtyProperties = true;
        }

        this.removePin = function(index) {
            this.pins.splice(index, 1);
        }

        this.cleanPins = function() {
            if (this.pins.length > 1) {
                var repeatPinsIndexes = new Array();
                for (var i = 0; i < this.pins.length; i++) {
                    var currentPin = this.pins[i];
                    var nextPin = this.pins[(i+1) % this.pins.length];
                    if (currentPin == nextPin) {
                        repeatPinsIndexes.push(i);
                    };
                };
                for (var i = repeatPinsIndexes.length - 1; i >= 0; i--) {
                    this.pins.splice(repeatPinsIndexes[i], 1);
                };
                this.setupBandParts();
                this.setupAngles();

                var indexOfStraightThroughPin = this.indexOfStraightThroughPin();
                while (indexOfStraightThroughPin != -1) {
                    var pin = this.pins[indexOfStraightThroughPin];
                    this.pins.splice(indexOfStraightThroughPin, 1);
                    this.setupBandParts();
                    this.setupAngles();
                    indexOfStraightThroughPin = this.indexOfStraightThroughPin();
                }
            };
        }

        this.indexOfStraightThroughPin = function() {
            var indexToReturn = -1;
            for (var i = 0; i < this.pins.length; i++) {
                var currentPart = this.bandParts[i];
                var nextPart = this.bandParts[(i+1) % this.bandParts.length];
                var currentRotation = currentPart.sprite.getParent().getRotation();
                if (currentRotation < 0) {
                    currentRotation += 360;
                };
                var nextRotation = nextPart.sprite.getParent().getRotation();
                if (nextRotation < 0) {
                    nextRotation += 360;
                };
                if (this.closeFloats(currentRotation, nextRotation)) {
                    indexToReturn = (i+1) % this.pins.length;
                };
            };
            return indexToReturn;
        }

        this.setDrawArea = function() {
            this.areaNode.clear();
            if (this.pins.length > 2) {
                var vertices = [];
                for (var i = 0; i < this.pins.length; i++) {
                    vertices.push(this.pins[i].sprite.getPosition());
                };
                this.areaNode.drawPoly(vertices, cc.c4f(0, 0, 0, 0.35), 0, cc.c4f(0,0,0,0));
            };
        };

        this.setupAngles = function() {
            this.angles = [];
            this.angleNode.removeAllChildren();
            if (this.pins.length > 1) {
                for (var i = 0; i < this.pins.length; i++) {
                    var angle = new Angle();
                    angle.init();
                    angle.setColour(this.colour);
                    if (this.geoboard.layer) {
                        var displaySameAngles = this.geoboard.layer.propertyDisplay === PropertyDisplays.SAME_ANGLES;
                        angle.displaySameAngles = displaySameAngles;
                        angle.background.setVisible(!displaySameAngles);
                    };
                    this.angles.push(angle);
                    var pin = this.pins[i];
                    angle.setPosition(pin.sprite.getPosition());
                    this.angleNode.addChild(angle);
                };
            }
            this.setAngleValues();
        }

        this.setAngleValues = function() {
            var totalAngle = 0;
            for (var i = 0; i < this.angles.length; i++) {
                var angle = this.angles[i];
                var inPart = this.bandParts.indexWraparound(i-1);
                var outPart = this.bandParts[i];
                var inPartAngle = cc.DEGREES_TO_RADIANS(180 + inPart.bandPartNode.getRotation());
                var outPartAngle = cc.DEGREES_TO_RADIANS(outPart.bandPartNode.getRotation());
                angle.startAngle = inPartAngle;
                var thisAngle = this.angleInCorrectRange(outPartAngle - inPartAngle);
                angle.anticlockwise = this.anticlockwise;
                if (this.anticlockwise) {
                    angle.throughAngle = thisAngle;
                } else {
                    angle.throughAngle = 2 * Math.PI - thisAngle;
                };
                if (Math.abs(angle.throughAngle - 2 * Math.PI) < 0.0001) {
                    angle.throughAngle = 0;
                };
                angle.setDrawAngle();
                var pin = this.pins[i];
                angle.setPosition(pin.sprite.getPosition());
                totalAngle += Math.PI - thisAngle;
                var stringToSet;
                if (angle.throughAngle === 0) {
                    stringToSet = "0";
                } else {
                    stringToSet = (Math.round(cc.RADIANS_TO_DEGREES(angle.throughAngle)*100)/100).toString();
                };
                angle.label.setString(stringToSet);
            };

            var beforeAnticlockwise = this.anticlockwise;
            if (Math.abs(totalAngle) > 1) {
                if (totalAngle < 0 || Math.abs(totalAngle) < 1) {
                    this.anticlockwise = false;
                } else {
                    this.anticlockwise = true;
                };
            };

            if (beforeAnticlockwise != this.anticlockwise) {
                this.setAngleValues();
            };
        }

        this.angleInCorrectRange = function(angle) {
            angle = angle % (2 * Math.PI);
            if (angle < 0) {
                angle += 2 * Math.PI;
            };
            return angle;
        }

        this.displaySameAngles = function(same) {
            for (var i = 0; i < this.angles.length; i++) {
                var angle = this.angles[i]
                angle.displaySameAngles = same;
                angle.background.setVisible(!same);
            }
        }

        this.setupSideLengths = function() {
            this.sideLengthsNode.removeAllChildren();
            this.sideLengthsLabels = [];
            for (var i = 0; i < this.bandParts.length; i++) {
                var bandPart = this.bandParts[i];
                var label = cc.LabelTTF.create("", "mikadoBold", 20);
                //label.setColor(cc.c4f(255,255,255,1));
                var labelBackground = new cc.Sprite();
                labelBackground.initWithFile(s_side_length_background);
                labelBackground.setColor(this.colour);
                this.sideLengthsLabels.push(label);
                label.setPosition(labelBackground.getContentSize().width * labelBackground.getScaleX()/2,
                    labelBackground.getContentSize().height * labelBackground.getScaleY()/2);
                labelBackground.addChild(label);
                this.sideLengthsNode.addChild(labelBackground);
            };
            this.setSideLengthValues();
        }

        this.setSideLengthValues = function() {
            for (var i = 0; i < this.bandParts.length; i++) {
                var bandPart = this.bandParts[i];
                var length = bandPart.length();
                var lengthString;
                if (length < 0.0001) {
                    lengthString = "0";
                } else {
                    lengthString = (Math.round(length*100)/100).toString();
                };
                var label = this.sideLengthsLabels[i];
                var labelXPosition = (bandPart.fromPin.sprite.getPosition().x + bandPart.toPin.sprite.getPosition().x)/2.0;
                var labelYPosition = (bandPart.fromPin.sprite.getPosition().y + bandPart.toPin.sprite.getPosition().y)/2.0;
                label.getParent().setPosition(labelXPosition, labelYPosition);
                label.setString(lengthString);
            };
        }

        this.clearSameSideLengthNotches = function() {
            for (var i = 0; i < this.sameSideLengthNotches.length; i++) {
                this.sameSideLengthNotches[i].removeFromParent();
            };
            this.sameSideLengthNotches = [];
        }

        this.sameSideLengthNotchesVisible = function(visible) {
            for (var i = 0; i < this.bandParts.length; i++) {
                this.bandParts[i].notchNode.setVisible(visible);
            };
        }

        this.clearParallelSideArrows = function() {
            for (var i = 0; i < this.parallelSideArrows.length; i++) {
                this.parallelSideArrows[i].removeFromParent();
            };
            this.parallelSideArrows = [];
        }

        this.parallelSideArrowsVisible = function(visible) {
            for (var i = 0; i < this.bandParts.length; i++) {
                this.bandParts[i].arrowNode.setVisible(visible);
            };
        }

        this.propertiesClean = function() {
            if (this.bandParts.length === 0) {
                this.setupBandParts();
                this.setPositionAndRotationOfBandParts();
            };
            this.regularClean();
            this.shapeClean();
            this.perimeterClean();
            this.areaClean();
            this.dirtyProperties = false;
        }

        this.getRegular = function() {
            if (this.dirtyProperties) {
                this.propertiesClean();
            };
            return this.regular;
        }

        this.getShape = function() {
            if (this.dirtyProperties) {
                this.propertiesClean();
            }
            return this.shape;
        }

        this.getPerimeter = function() {
            if (this.dirtyProperties) {
                this.propertiesClean();
            };
            return this.perimeter;
        }

        this.getArea = function() {
            if (this.dirtyProperties) {
                this.propertiesClean();
            };
            return this.area;
        }

        this.regularClean = function() {
            var regular;
            if (this.bandParts.length < 3) {
                regular = "";
            } else {
                regular = "Regular";
                var firstBandPart = this.bandParts[0];
                var sideLength = firstBandPart.length();
                for (var i = 1; i < this.bandParts.length; i++) {
                    var bandPart = this.bandParts[i];
                    var thisLength = bandPart.length();
                    if (Math.abs(thisLength - sideLength) > 0.0001) {
                        regular = "Irregular";
                        break;
                    };
                };
                if (regular) {
                    var angle = this.angles[0];
                    for (var i = 1; i < this.angles.length; i++) {
                        var thisAngle = this.angles[i];
                        if (Math.abs(angle.throughAngle - thisAngle.throughAngle) > 0.0001) {
                            regular = "Irregular";
                            break;
                        };
                    };
                };
            };
            this.regular = regular;
        }

        this.shapeClean = function() {
            var numberOfSides = this.bandParts.length;
            var shapeName = "";
            if (!this.edgesCrossOver()) {  
                switch(numberOfSides) {
                    case 3:
                        shapeName = this.triangleName();
                        break;
                    case 4:
                        shapeName = this.quadrilateralName();
                        break;
                    case 5:
                        shapeName = "Pentagon";
                        break;
                    case 6:
                        shapeName = "Hexagon";
                        break;
                    case 7:
                        shapeName = "Heptagon";
                        break;
                    case 8 :
                        shapeName = "Octagon";
                        break;
                    case 9:
                        shapeName = "Nonagon";
                        break;
                    case 10:
                        shapeName = "Decagon";
                        break;
                    default:
                        if (numberOfSides < 3) {
                            shapeName = "";
                        } else if (numberOfSides > 10) {
                            shapeName = "Polygon";
                        };
                        break;
                }
            };
            this.shape =  shapeName;
        }

        this.triangleName = function() {
            var triangleName = "Scalene triangle";
            var sides = [];
            for (var i = 0; i < 3; i++) {
                sides.push(this.bandParts[i].length());
            };
            sides.sort(function(a,b) {return a-b});
            if (this.closeFloats(sides[0], sides[2])) {
                triangleName = "Equilateral triangle";
            } else if (this.closeFloats(sides[0], sides[1]) || this.closeFloats(sides[1], sides[2])) {
                triangleName = "Isoceles triangle";
            };
            return triangleName;
        }

        this.quadrilateralName = function() {
            var quadrilateralName = "Quadrilateral";
            var angles = [];
            for (var i = 0; i < 4; i++) {
                angles.push(this.angles[i].throughAngle);
            };
            angles.sort(function(a,b) {return a-b});
            var sides = [];
            for (var i = 0; i < this.bandParts.length; i++) {
                sides.push(this.bandParts[i].length());
            };
            sides.sort(function(a,b) {return a-b});

            if (this.closeFloats(angles[0], angles[3]) && this.closeFloats(angles[0], Math.PI/2)) {
                if (this.closeFloats(sides[0], sides[3])) {
                    quadrilateralName = "Square";
                } else {
                    quadrilateralName = "Rectangle";
                };
            } else {
                if (this.closeFloats(sides[0], sides[3])) {
                    quadrilateralName = "Rhombus";
                } else if (this.bandParts[0].parallelTo(this.bandParts[2]) && this.bandParts[1].parallelTo(this.bandParts[3])) {
                    quadrilateralName = "Parallelogram";
                } else if (this.bandParts[0].parallelTo(this.bandParts[2]) || this.bandParts[1].parallelTo(this.bandParts[3])) {
                    quadrilateralName = "Trapezium";
                } else if ((this.closeFloats(sides[0], sides[1]) && this.closeFloats(sides[2], sides[3])) 
                    || (this.closeFloats(sides[1], sides[2]) && this.closeFloats(sides[0], sides[3]))) {
                    quadrilateralName = "Kite";
                };
            };
            return quadrilateralName;
        }

        this.perimeterClean = function() {
            var perimeter = null;
            if (!this.edgesCrossOver()) {
                perimeter = 0;
                for (var i = 0; i < this.bandParts.length; i++) {
                    perimeter += this.bandParts[i].length();
                };
            }
            this.perimeter = perimeter;
        }

        this.areaClean = function() {
            var area = null;
            if (!this.edgesCrossOver()) {
                var dummyGeoboard = new Geoboard();
                dummyGeoboard.unitDistance = this.geoboard.unitDistance;
                var band = new Band();
                band.geoboard = dummyGeoboard;
                band.pins = this.pins.slice(0);
                band.angleNode = new cc.Node();
                band.colour = cc.c3b(0,0,0);
                band.setupBandParts();
                band.setupAngles();
                area = band.areaRecursive();
            };
            this.area = area;
        }

        this.areaRecursive = function() {
            var area;
            if (this.pins.length < 3) {
                area = 0;
            } else if (this.pins.length === 3) {
                area = this.areaOfEar(0);
            } else {
                var earPinIndex;
                for (var i = 0; i < this.angles.length; i++) {
                    if (this.isEarPin(i)) {
                        earPinIndex = i;
                        break;
                    };
                };
                var previousPin = this.pins.indexWraparound(earPinIndex-1);
                var thisPin = this.pins[earPinIndex];
                var nextPin = this.pins.indexWraparound(earPinIndex+1);
                var earArea = this.areaOfEar(earPinIndex);
                this.pins.splice(earPinIndex, 1);
                this.setupBandParts();
                this.setupAngles();
                var remainderArea = this.areaRecursive();
                area = earArea + remainderArea;
            }
            return area;
        }

        this.isEarPin = function(index) {
            var isEarPin = true;
            var angle = this.angles[index];
            if (angle.throughAngle > 180) {
                isEarPin = false;
            } else {
                var previousPin = this.pins.indexWraparound(index-1);
                var nextPin = this.pins.indexWraparound(index+1);
                var bandPart = new BandPart();
                bandPart.setup(this, previousPin, nextPin);
                for (var i = 0; i < this.bandParts.length; i++) {
                    var otherBandPart = this.bandParts[i];
                    if (bandPart.crosses(otherBandPart)) {
                        isEarPin = false;
                    };
                };
                var halfwayX = (previousPin.sprite.getPosition().x + nextPin.sprite.getPosition().x)/2;
                var halfwayY = (previousPin.sprite.getPosition().y + nextPin.sprite.getPosition().y)/2;
                if (!this.pointInsideBand(cc.p(halfwayX, halfwayY))) {
                    isEarPin = false;
                };
            };
            return isEarPin;
        }

        this.pointInsideBand = function(point) {
            var dummyPinStart = new Pin();
            dummyPinStart.sprite.setPosition(point);
            var dummyPinEnd = new Pin();
            dummyPinEnd.sprite.setPosition(point.x, point.y + 1000);
            var bandPartUp = new BandPart();
            bandPartUp.fromPin = dummyPinStart;
            bandPartUp.toPin = dummyPinEnd;
            var numberOfCrossings = 0;
            for (var i = 0; i < this.bandParts.length; i++) {
                var bandPart = this.bandParts[i];
                if (bandPart.crosses(bandPartUp)) {
                    numberOfCrossings += 1;
                };
            };
            var inside = (numberOfCrossings % 2) === 1;
            return inside;
        };

        this.areaOfEar = function(index) {
            var fromPart = this.bandParts.indexWraparound(index - 1);
            var toPart = this.bandParts[index];
            var angle = this.angles[index];
            var area = 1/2 * fromPart.length() * toPart.length() * Math.sin(angle.throughAngle);
            return area;
        }

        this.edgesCrossOver = function() {
            var edgesCrossOver = false;
            for (var i = 0; i < this.bandParts.length; i++) {
                var thisBandPart = this.bandParts[i];
                for (var j = i+1; j < this.bandParts.length; j++) {
                    var otherBandPart = this.bandParts[j];
                    if (thisBandPart.crosses(otherBandPart)) {
                        edgesCrossOver = true;
                        break;
                    };
                };
                if (edgesCrossOver) {
                    break;
                };
            };
            return edgesCrossOver;
        }
        

        this.closeFloats = function(floatA, floatB) {
            return Math.abs(floatA - floatB) < 0.001;
        }

    }

    return Band;
});

