define([], function () {
    'use strict';

    function MovingPin() {
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(window.bl.getResource('hand_up'));
        this.sprite.setAnchorPoint(cc.p(0.63, 0.88));
    }

    return MovingPin;

});
