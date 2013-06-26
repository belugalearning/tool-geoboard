var Angle = cc.DrawNode.extend({
    startAngle:0,
    throughAngle:0,
    label: null,
    anticlockwise: false,
    colour:null,
    displaySameAngles:null,
    numberOfArcs:0,

    init:function() {
        this._super();
        this.background = new cc.Sprite()
        this.background.initWithFile(s_angle_background);
        this.addChild(this.background);
        this.label = cc.LabelTTF.create("", "mikadoBold", 15);
        this.label.setColor(cc.c4f(255,255,255,1));
        this.background.setPosition(0, 35);
        this.label.setPosition(this.background.getContentSize().width/2, this.background.getContentSize().height/2);
        this.background.addChild(this.label);
    },

    setColour:function(colour) {
        this.colour = colour;
        this.background.setColor(colour);
    },

    setDrawAngle:function() {
        this.clear();
        if (this.displaySameAngles) {
            for (var i = 0; i < this.numberOfArcs; i++) {
                this.drawSector(cc.p(0,0), 45 + 5 * i, this.startAngle, this.throughAngle, this.anticlockwise, 
                    cc.c4f(0,0,0,0), 2, this.colourCorrect());
            };
        } else {
            this.drawSector(cc.p(0,0), 50, this.startAngle, this.throughAngle, this.anticlockwise, this.lightColour(), 2, this.colourCorrect());
        };
    },

    colourCorrect:function() {
        var red = this.colour.r/255;
        var green = this.colour.g/255;
        var blue = this.colour.b/255;
        return cc.c4f(red, green, blue, 1);
    },

    lightColour:function() {
        var red = this.colour.r/255;
        var green = this.colour.g/255;
        var blue = this.colour.b/255;
        return cc.c4f(red, green, blue, 0.5);
    },
});
