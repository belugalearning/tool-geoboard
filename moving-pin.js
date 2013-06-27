define([], function () {
    'use strict';

    function MovingPin() {
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(s_moving_pin);
        this.sprite.setAnchorPoint(cc.p(0.63, 0.88));
    }

    return MovingPin;

});
