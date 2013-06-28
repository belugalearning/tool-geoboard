define([], function () {
    'use strict';

    return {
        'PropertyDisplays': {
            NONE: 'none',
            REGULAR: 'regular',
            SHAPE: 'shape',
            PERIMETER: 'perimeter',
            AREA: 'area',
            ANGLES: 'angles',
            SAME_ANGLES: 'same angles',
            SIDE_LENGTHS: 'side lengths',
            SAME_SIDE_LENGTHS: 'same side lengths',
            PARALLEL_SIDES: 'parallel sides'
        },
        'GeoboardTypes': {
            LATTICE: 'lattice',
            SKEWED_LATTICE: 'skewedlattice',
            CIRCULAR: 'circular'
        },
        'PROPERTY_BUTTON_PREFIX': 'propertybutton_',
        'BAND_BUTTON_PREFIX': 'bandbutton_',
        'BOARD_BUTTON_PREFIX': 'boardbutton_'
    };
});
