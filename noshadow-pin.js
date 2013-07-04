define([], function () {
    'use strict';

    function NoShadowPin() {
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(bl.resources['images_geoboard_pin_white_noshadow']);
        this.sprite.setAnchorPoint(cc.p(0.5, 0.45));
    }

    return NoShadowPin;

});
