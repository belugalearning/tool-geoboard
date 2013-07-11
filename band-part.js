define(['pin', 'moving-pin', 'noshadow-pin'], function (Pin, MovingPin, NoShadowPin) {
    'use strict';

    function BandPart() {
        this.baseNode = new cc.Node();
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(bl.resources['images_geoboard_band_1_white']);
        this.sprite.setScaleX(1.5);
        this.bandPartNode = new cc.Node();
        this.sprite.setAnchorPoint(cc.p(0.5, 0));
        this.baseNode.setAnchorPoint(cc.p(0.5, 0));
        this.baseNode.addChild(this.bandPartNode);
        this.bandPartNode.addChild(this.sprite);
        this.notchNode = new cc.Node();
        this.baseNode.addChild(this.notchNode);
        this.arrowNode = new cc.Node();
        this.baseNode.addChild(this.arrowNode);

        this.setup = function(band, fromPin, toPin) {
            this.band = band;
            this.fromPin = fromPin;
            this.toPin = toPin;
            if (!(toPin instanceof MovingPin)) {
                this.dummyEndPin = new NoShadowPin();
                this.dummyEndPin.sprite.setZOrder(1);
                this.baseNode.addChild(this.dummyEndPin.sprite);         
            };
            if (!(fromPin instanceof MovingPin)) {
                this.dummyStartPin = new NoShadowPin();
                this.dummyStartPin.sprite.setZOrder(1);
                this.baseNode.addChild(this.dummyStartPin.sprite);
            };
            this.notchNode.setVisible(this.band.geoboard.sideDisplay === "sameSideLengths");
            this.arrowNode.setVisible(this.band.geoboard.sideDisplay === "parallelSides");
        }

        this.setPositionAndRotation = function() {
            var fromPin = this.fromPin;
            var toPin = this.toPin;
            this.bandPartNode.setPosition(fromPin.sprite.getPosition());
            this.notchNode.setPosition(fromPin.sprite.getPosition());
            this.arrowNode.setPosition(fromPin.sprite.getPosition());
            if (this.dummyStartPin) {
                this.dummyStartPin.sprite.setPosition(fromPin.sprite.getPosition());
            };
            if (this.dummyEndPin) {
                this.dummyEndPin.sprite.setPosition(toPin.sprite.getPosition());
            };
            var xDifference = toPin.sprite.getPosition().x - fromPin.sprite.getPosition().x;
            var yDifference = toPin.sprite.getPosition().y - fromPin.sprite.getPosition().y;
            var angle =  Math.atan2(xDifference, yDifference);
            this.bandPartNode.setRotation(cc.RADIANS_TO_DEGREES(angle));
            this.notchNode.setRotation(cc.RADIANS_TO_DEGREES(angle));
            this.arrowNode.setRotation(cc.RADIANS_TO_DEGREES(angle));
            var pinDistance = this.pinDistance();
            var scaleFactor = pinDistance/this.sprite.getContentSize().height;
            this.bandPartNode.setScaleY(scaleFactor);
        }

        this.pinDistance = function() {
            var fromPosition = this.fromPin.sprite.getPosition();
            var toPosition = this.toPin.sprite.getPosition();
            var pinDistance = cc.pDistance(fromPosition, toPosition);
            return pinDistance;
        }

        this.length = function() {
            var pinDistance = this.pinDistance();
            var distanceBetweenPins = this.band.geoboard.unitDistance;
            var length = pinDistance/distanceBetweenPins;
            return length;
        }

        this.addNotches = function(numberOfNotches) {
            this.numberOfIndicators = numberOfNotches;
            var spacing = 8;
            for (var i = 1; i <= numberOfNotches; i++) {
                var notch = new cc.Sprite();
                notch.initWithFile(bl.resources['images_geoboard_samesidelengthnotch']);
                notch.setRotation(90);
                var yPosition = this.indicatorYPosition(i, spacing);
                notch.setPosition(0, yPosition);
                notch.setColor(this.band.colour);
                this.notchNode.addChild(notch);
                this.band.sameSideLengthNotches.push(notch);
            };
        }

        this.addArrows = function(numberOfArrows, forward) {
            this.numberOfIndicators = numberOfArrows;
            var spacing = 8;
            for (var i = 1; i <= numberOfArrows; i++) {
                var arrow = new cc.Sprite();
                arrow.initWithFile(bl.resources['images_geoboard_parallelsidearrow']);
                var rotation = forward ? 90 : -90;
                arrow.setRotation(rotation);
                arrow.setScale(0.5);
                var yPosition = this.indicatorYPosition(i, spacing);
                arrow.setPosition(0, yPosition);
                arrow.setColor(this.band.colour);
                this.arrowNode.addChild(arrow)
                this.band.parallelSideArrows.push(arrow);
            };
        }

        this.indicatorYPosition = function(index, spacing) {
            var halfway = this.sprite.getContentSize().height * this.bandPartNode.getScaleY()/2;
            var offset = (2 * index - this.numberOfIndicators - 1) * spacing/2;
            var yPosition = halfway + offset;
            return yPosition;
        }

        this.parallelTo = function(otherBandPart) {
            var parallel = false;
            var firstRotation = this.bandPartNode.getRotation();
            var secondRotation = otherBandPart.bandPartNode.getRotation();
            if (Math.abs(firstRotation - secondRotation) < 0.0001) {
                parallel = true;
            };
            if (Math.abs(Math.abs(firstRotation - secondRotation) - 180) < 0.0001) {
                parallel = true;
            };
            return parallel;
        }

        this.crosses = function(otherBandPart) {
            /*
            this bandPart from point A (i.e., (a_1, a_2) to B, other bandPart from C to D, this function solves
            (a_1, a_2) + lambda * ((b_1, b_2) - (a_1, a_2)) = (c_1, c_2) + mu * ((d_1, d_2) - (c_1, c_2)), the solution corresponding
            to point where the two lines cross (if they do), and returns true if lambda and mu are both between 0 and 1,
            i.e., the crossing point is between A and B on this bandPart, and C and D on other bandPart.
            */
            var crosses = true;
            var pointA = this.fromPin.sprite.getPosition();
            var pointB = this.toPin.sprite.getPosition();
            var pointC = otherBandPart.fromPin.sprite.getPosition();
            var pointD = otherBandPart.toPin.sprite.getPosition();

            var firstArray = [pointA, pointB];
            var secondArray = [pointC, pointD];

            for (var i = 0; i < firstArray.length; i++) {
                for (var j = 0; j < secondArray.length; j++) {
                    var distance = cc.pDistance(firstArray[i], secondArray[j]);
                    if (distance < 0.0001) {
                        crosses = false;
                    };
                };
            };

            if (crosses) {            
                var thisNumeratorFirst = (pointD.x - pointC.x) * (pointA.y - pointC.y);
                var thisNumeratorSecond = (pointD.y - pointC.y) * (pointA.x - pointC.x);
                var thisNumerator = thisNumeratorFirst - thisNumeratorSecond;

                var otherNumeratorFirst = (pointC.x - pointA.x) * (pointB.y - pointA.y);
                var otherNumeratorSecond = (pointC.y - pointA.y) * (pointB.x - pointA.x);
                var otherNumerator = otherNumeratorFirst - otherNumeratorSecond;

                var denominatorFirst = (pointD.y - pointC.y) * (pointB.x - pointA.x);
                var denominatorSecond = (pointD.x - pointC.x) * (pointB.y - pointA.y);
                var denominator = denominatorFirst - denominatorSecond;
                if (denominator === 0) {
                    crosses = false;
                } else {
                    var lambda= parseFloat(thisNumerator)/denominator;
                    var mu = parseFloat(otherNumerator)/denominator;
                    crosses = 0.0001 < lambda && lambda < 0.9999 && 0.0001 < mu && mu < 0.9999;
                };
            };
            return crosses;
        }
    }

    return BandPart;
});
