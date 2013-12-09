/**
 * easy-sketch.js
 *
 * @link https://github.com/brian978/easy-sketch.js
 * @copyright Copyright (c) 2013
 * @license Creative Commons Attribution-ShareAlike 3.0
 */

var EasySketch = EasySketch || {};

EasySketch.EventManager = function (binding) {
    "use strict";
    var $this = this;

    this.manager = $(binding);

    return {
        /**
         *
         * @param {String} eventType
         * @param {Array|Object=null} params
         */
        trigger: function (eventType, params) {
            $this.manager.trigger(eventType, params || null);
        },
        /**
         *
         * @param {String} eventType
         * @param {Function} handler
         * @param {Array=null} data Some data that can be passed to the function call
         */
        attach: function (eventType, handler, data) {
            $this.manager.on(eventType, data || null, handler);
        },
        /**
         *
         * @param {String} eventType
         * @param {Function} handler
         */
        detach: function (eventType, handler) {
            $this.manager.unbind(eventType, handler);
        }
    };
};

/**
 *
 * @param {*} element
 * @param {Object=null} options
 * @constructor
 */
EasySketch.Sketch = function (element, options) {
    "use strict";
    var $this = this;

    this.binded = false;
    this.drawing = false;
    this.events = new EasySketch.EventManager(this);
    this.eraser = false;
    this.canvas = this.__createCanvas(element);
    this.context = this.canvas.get(0).getContext("2d");
    this.options = {
        color: "#000000",
        width: 5,
        bindingObject: null
    };

    if (options) {
        this.setOptions(options);
    }

    this.__attachListeners();
};

EasySketch.Sketch.START_PAINTING_EVENT = 'sketch.start';
EasySketch.Sketch.PAINT_EVENT = 'sketch.paint';
EasySketch.Sketch.STOP_PAINTING_EVENT = 'sketch.stop';

/**
 *
 * @param options
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.setOptions = function (options) {
    "use strict";

    this.options = $.extend(this.options, options || {});

    // Converting the bindingObject to jQuery
    if(this.options["bindingObject"] instanceof jQuery === false) {
        this.options["bindingObject"] = $(this.options["bindingObject"]);
    }

    return this;
};

/**
 * Returns the value of an option if it exists and null (if this isn't changed) if it doesn't
 *
 * @param {String} name
 * @param {*=null} defaultValue
 * @returns {*}
 */
EasySketch.Sketch.prototype.getOption = function(name, defaultValue) {
    defaultValue = defaultValue || null;

    if(this.options.hasOwnProperty(name)){
        return this.options[name];
    }

    return defaultValue;
};

/**
 *
 * @returns {EventManager|*}
 */
EasySketch.Sketch.prototype.getEventManager = function () {
    "use strict";
    return this.events;
};

/**
 *
 * @param {*} element
 * @returns {*}
 */
EasySketch.Sketch.prototype.__createCanvas = function (element) {
    "use strict";
    var canvas;
    var elementType = typeof element;

    switch (elementType) {
        case "string":
            if (element.indexOf('#') === 0) {
                canvas = $(element);
            } else if (element.indexOf('.') === -1) {
                canvas = $("#" + element);
            }
            break;

        case "object":
            if (element instanceof jQuery) {
                canvas = element;
            } else {
                canvas = $(element);
            }
            break;
    }

    return canvas;
};

/**
 *
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.__attachListeners = function () {
    "use strict";

    if(this.binded === true) {
        return this;
    }

    this.binded = true;

    // Selecting the object to bind on
    var bindingObject;
    if(this.getOption("bindingObject") !== null) {
        bindingObject = this.options["bindingObject"];
    } else {
        bindingObject = this.canvas;
    }

    // Something to avoid duplicates
    var startPainting = this.__startDrawing.bind(this);
    var paint = this.__draw.bind(this);
    var stopPainting = this.__stopDrawing.bind(this);

    // Canvas listeners
    bindingObject.on('mousedown touchstart', startPainting);
    bindingObject.on('mousemove touchmove', paint);
    bindingObject.on('mouseup mouseleave mouseout touchend touchcancel', stopPainting);

    // Event manager listeners
    this.events.attach(EasySketch.Sketch.START_PAINTING_EVENT, startPainting);
    this.events.attach(EasySketch.Sketch.PAINT_EVENT, paint);
    this.events.attach(EasySketch.Sketch.STOP_PAINTING_EVENT, stopPainting);

    return this;
};

/**
 * Listeners can also be detached if this is required
 *
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.detachListeners = function(){
    "use strict";

    if(this.binded === false) {
        return this;
    }

    this.binded = false;

    // Selecting the object to bind on
    var bindingObject;
    if(this.getOption("bindingObject") !== null) {
        bindingObject = this.options["bindingObject"];
    } else {
        bindingObject = this.canvas;
    }

    // Something to avoid duplicates
    var startPainting = this.__startDrawing.bind(this);
    var paint = this.__draw.bind(this);
    var stopPainting = this.__stopDrawing.bind(this);

    // Canvas listeners
    bindingObject.off('mousedown touchstart', startPainting);
    bindingObject.off('mousemove touchmove', paint);
    bindingObject.off('mouseup mouseleave mouseout touchend touchcancel', stopPainting);

    // Event manager listeners
    this.events.detach(EasySketch.Sketch.START_PAINTING_EVENT, startPainting);
    this.events.detach(EasySketch.Sketch.PAINT_EVENT, paint);
    this.events.detach(EasySketch.Sketch.STOP_PAINTING_EVENT, stopPainting);

    return this;
};

/**
 *
 * @param {Event} e
 * @returns {{x: Number, y: Number}}
 */
EasySketch.Sketch.prototype.getPointerPosition = function (e) {
    "use strict";
    var $this = this;

    return {
        x: e.pageX - $this.canvas.offset().left,
        y: e.pageY - $this.canvas.offset().top
    }
};

/**
 *
 * @param {Boolean} value
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.enableEraser = function (value) {
    "use strict";
    this.eraser = value;

    return this;
};

/**
 *
 * @param {Event=null} e
 * @param {Object=null} pos This is like a virtual mouse position when triggering this using the event manager
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.__startDrawing = function (e, pos) {
    "use strict";

    if (this.drawing === true) {
        console.log('Something if definitely wrong here...');
        return this;
    }

    // Adding some CSS in the mix
    this.canvas.css('cursor', 'pointer');

    // Getting to information
    var mouse = pos || this.getPointerPosition(e);
    var color = this.options.color;

    // Setting the flag first
    this.drawing = true;

    // Saving first to avoid changing other stuff
    this.context.save();

    if (this.eraser) {
        color = "rgba(0,0,0,0)";
        // We do a save first to keep the previous globalCompositionOperation
        this.context.save();
        this.context.globalCompositeOperation = "copy";
    }

    // Applying our requirements
    this.context.strokeStyle = color;
    this.context.lineWidth = this.options.width;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";

    // Beginning the path
    this.context.beginPath();
    this.context.moveTo(mouse.x, mouse.y);

    return this;
};

/**
 *
 * @param {Event=null} e
 * @param {Object=null} pos This is like a virtual mouse position when triggering this using the event manager
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.__draw = function (e, pos) {
    "use strict";

    if (this.drawing === false) {
        console.log('How about starting the drawing first?');
        return this;
    }

    var mouse = pos || this.getPointerPosition(e);

    // Adding a new point to the path
    this.context.lineTo(mouse.x, mouse.y);
    this.context.stroke();

    return this;
};

/**
 *
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.__stopDrawing = function () {
    "use strict";
    if(this.drawing === false) {
        console.log('Nothing to stop...');
        return this;
    }

    this.drawing = false;

    // Adding some CSS in the mix
    this.canvas.css('cursor', 'auto');

    // Restore is called twice to also restore the globalCompositionOperation
    this.context.restore();
    this.context.restore();

    return this;
};

/**
 *
 * @param {Array} pointsArray
 * @returns {EasySketch.Sketch}
 */
EasySketch.Sketch.prototype.drawLine = function (pointsArray) {
    "use strict";

    var points = pointsArray.slice();
    var coordinates = points[0];

    // Executing the drawing operations
    this.__startDrawing(null, coordinates);
    while(points.length > 0) {
        coordinates = points.shift();
        this.context.lineTo(coordinates.x, coordinates.y);
    }
    this.context.stroke();
    this.__stopDrawing();

    return this;
};
