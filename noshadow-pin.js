define([], function () {
    'use strict';

    function NoShadowPin() {
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(s_pin_no_shadow);
        this.sprite.setAnchorPoint(cc.p(0.5, 0.45));
    }

    return NoShadowPin;

});
