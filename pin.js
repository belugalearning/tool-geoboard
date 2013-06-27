define([], function () {
    'use strict';

    function Pin() {
        this.sprite = new cc.Sprite();
        this.sprite.initWithFile(s_pin);

        this.highlightPin = function(highlight) {
            if (highlight) {
                /*
                var highlightPinTexture = cc.TextureCache.getInstance().textureForKey(cc.FileUtils.getInstance().fullPathForFilename(s_white_pin));
                this.sprite.setTexture(highlightPinTexture);
                */
                var highlightColour = cc.c3b(233, 142, 51);
                this.sprite.setColor(highlightColour);
            } else {
                var pinTexture = cc.TextureCache.getInstance().textureForKey(cc.FileUtils.getInstance().fullPathForFilename(s_pin));
                this.sprite.setTexture(pinTexture);
                var unHighlightColour = cc.c3b(255,255,255);
                this.sprite.setColor(unHighlightColour);
            }
        };
    }

    return Pin;

});
