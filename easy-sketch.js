/**
 * easy-sketch.js
 *
 * @link https://github.com/brian978/easy-sketch.js
 * @copyright Copyright (c) 2013
 * @license Creative Commons Attribution-ShareAlike 3.0
 */

var EasySketch = EasySketch || {};

EasySketch.EventManager = function (binding) {
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
    this.lastMouse = {x: 0, y: 0};
    this.disabled = false;
    this.binded = false;
    this.drawing = false;
    this.events = new EasySketch.EventManager(this);
    this.eraser = false;
    this.canvas = this._createCanvas(element);
    this.context = this.canvas.get(0).getContext("2d");

    this.options = {
        color: "#000000",
        width: 5,
        alpha: 1,
        bindingObject: null,
        autoBind: true
    };

    this.listeners = {
        start: this._startDrawing.bind(this),
        draw: this._draw.bind(this),
        stop: this._stopDrawing.bind(this)
    };

    if (options) {
        this.setOptions(options);
    }

    if (this.options.autoBind === true) {
        this.attachListeners();
    }
};

// Listened events
EasySketch.Sketch.START_PAINTING_EVENT = 'sketch.start';
EasySketch.Sketch.PAINT_EVENT = 'sketch.paint';
EasySketch.Sketch.STOP_PAINTING_EVENT = 'sketch.stop';

// Triggered events
EasySketch.Sketch.NOTIFY_START_EVENT = 'notify.start';
EasySketch.Sketch.NOTIFY_PAINT_EVENT = 'notify.paint';
EasySketch.Sketch.NOTIFY_STOP_EVENT = 'notify.stop';

EasySketch.Sketch.prototype = {
    /**
     *
     * @param options
     * @returns {EasySketch.Sketch}
     */
    setOptions: function (options) {
        this.options = $.extend(this.options, options || {});

        return this;
    },

    /**
     * Returns the value of an option if it exists and null (if this isn't changed) if it doesn't
     *
     * @param {String} name
     * @param {*=null} defaultValue
     * @returns {*}
     */
    getOption: function (name, defaultValue) {
        defaultValue = defaultValue || null;

        if (this.options.hasOwnProperty(name)) {
            return this.options[name];
        }

        return defaultValue;
    },

    /**
     *
     * @returns {EventManager|*}
     */
    getEventManager: function () {
        return this.events;
    },

    /**
     *
     * @param {*} element
     * @returns {*}
     * @private
     */
    _createCanvas: function (element) {
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
    },

    /**
     *
     * @returns {EasySketch.Sketch}
     */
    attachListeners: function () {
        if (this.binded === true) {
            return this;
        }

        this.binded = true;

        // Selecting the object to bind on
        var bindingObject;
        if (this.getOption("bindingObject") !== null) {
            bindingObject = this.options["bindingObject"];
        } else {
            bindingObject = this.canvas;
        }

        // Canvas listeners
        bindingObject.on('mousedown touchstart', this.listeners.start);
        bindingObject.on('mousemove touchmove', this.listeners.draw);
        bindingObject.on('mouseup mouseleave mouseout touchend touchcancel', this.listeners.stop);

        // Event manager listeners
        this.events.attach(EasySketch.Sketch.START_PAINTING_EVENT, this.listeners.start);
        this.events.attach(EasySketch.Sketch.PAINT_EVENT, this.listeners.draw);
        this.events.attach(EasySketch.Sketch.STOP_PAINTING_EVENT, this.listeners.stop);

        return this;
    },

    /**
     * Listeners can also be detached if this is required
     *
     * @returns {EasySketch.Sketch}
     */
    detachListeners: function () {
        if (this.binded === false) {
            return this;
        }

        this.binded = false;

        // Selecting the object to bind on
        var bindingObject;
        if (this.getOption("bindingObject") !== null) {
            bindingObject = this.options["bindingObject"];
        } else {
            bindingObject = this.canvas;
        }

        // Canvas listeners
        bindingObject.off('mousedown touchstart', this.listeners.start);
        bindingObject.off('mousemove touchmove', this.listeners.draw);
        bindingObject.off('mouseup mouseleave mouseout touchend touchcancel', this.listeners.stop);

        // Event manager listeners
        this.events.detach(EasySketch.Sketch.START_PAINTING_EVENT, this.listeners.start);
        this.events.detach(EasySketch.Sketch.PAINT_EVENT, this.listeners.draw);
        this.events.detach(EasySketch.Sketch.STOP_PAINTING_EVENT, this.listeners.stop);

        return this;
    },

    /**
     *
     * @returns {number}
     */
    getScale: function () {
        var property = null;
        var canvasStyle = this.canvas[0].style;
        var scale = 1;

        // Looking for the non-prefixed property first since it's easier
        if ("transform" in canvasStyle) {
            property = "transform";
        } else {
            // Determining the property to use
            var prefixes = ["-moz", "-webkit", "-o", "-ms"];
            var propertyName = "";
            for (var i = 0; i < prefixes.length; i++) {
                propertyName = prefixes[i] + "-transform";
                if (propertyName in canvasStyle) {
                    property = propertyName;
                    break;
                }
            }
        }

        if (property !== null) {
            var matrix = String(this.canvas.css(property));
            if (matrix != "none") {
                var regex = new RegExp("([0-9.-]+)", "g");
                var matches = matrix.match(regex);
                scale = matches[0];
            }
        }

        return scale;
    },

    /**
     *
     * @param {Event} e
     * @returns {{x: Number, y: Number}}
     */
    getPointerPosition: function (e) {
        var $this = this;
        var scale = this.getScale();

        if (e.hasOwnProperty("originalEvent") && e.originalEvent.hasOwnProperty("targetTouches")) {
            e.pageX = e.originalEvent.targetTouches[0].pageX;
            e.pageY = e.originalEvent.targetTouches[0].pageY;
        }

        return {
            x: Math.ceil((e.pageX - $this.canvas.offset().left) / scale),
            y: Math.ceil((e.pageY - $this.canvas.offset().top) / scale)
        }
    },

    /**
     *
     * @param {Boolean} value
     * @returns {EasySketch.Sketch}
     */
    enableEraser: function (value) {
        this.eraser = value;

        return this;
    },

    /**
     *
     * @returns {EasySketch.Sketch}
     * @private
     */
    _contextSetup: function () {
        // Saving first to avoid changing other stuff
        this.context.save();

        // Applying our requirements
        this.context.strokeStyle = this.options.color;
        this.context.lineWidth = this.options.width;
        this.context.globalAlpha = this.options.alpha;
        this.context.lineCap = "round";
        this.context.lineJoin = "round";

        return this;
    },

    /**
     *
     * @returns {EasySketch.Sketch}
     * @private
     */
    _contextRestore: function () {
        this.context.restore();

        return this;
    },

    /**
     *
     * @param {Event=null} e
     * @param {Object=null} pos This is like a virtual mouse position when triggering this using the event manager
     * @returns {EasySketch.Sketch}
     * @private
     */
    _startDrawing: function (e, pos) {
        if (this.drawing === true || this.disabled === true) {
            return this;
        }

        // To be able to handle touch events
        e.preventDefault();

        // Adding some CSS in the mix
        this.canvas.css('cursor', 'pointer');

        // Getting to information
        var mouse = pos || this.getPointerPosition(e);

        this.getEventManager().trigger(EasySketch.Sketch.NOTIFY_START_EVENT, [mouse]);

        // Setting the flag first
        this.drawing = true;

        // Setting up the context with our requirements
        this._contextSetup();

        // Storing the current mouse position so we can draw later
        this.lastMouse = mouse;

        return this;
    },

    /**
     *
     * @param {Event=null} e
     * @param {Object=null} pos This is like a virtual mouse position when triggering this using the event manager
     * @returns {EasySketch.Sketch}
     * @private
     */
    _draw: function (e, pos) {
        if (this.drawing === false || this.disabled === true) {
            return this;
        }

        // To be able to handle touch events
        e.preventDefault();

        var mouse = pos || this.getPointerPosition(e);

        this.getEventManager().trigger(EasySketch.Sketch.NOTIFY_PAINT_EVENT, [mouse]);

        // Configuring the pen
        if (this.eraser) {
            // We do a save first to keep the previous globalCompositionOperation
            this.context.save();
            this.context.strokeStyle = "rgba(0,0,0,1)";
            this.context.globalCompositeOperation = "destination-out";
        }

        // Adding a new point to the path
        this.context.beginPath();
        this.context.moveTo(this.lastMouse.x, this.lastMouse.y);
        this.context.lineTo(mouse.x, mouse.y);
        this.context.closePath();
        this.context.stroke();

        // Restoring the globalCompositeOperation
        if (this.eraser) {
            this.context.restore();
        }

        // Updating the last mouse position
        this.lastMouse = mouse;

        return this;
    },

    /**
     *
     * @returns {EasySketch.Sketch}
     * @private
     */
    _stopDrawing: function () {
        if (this.drawing === false) {
            return this;
        }

        this.drawing = false;

        // Adding some CSS in the mix
        this.canvas.css('cursor', 'auto');

        // Restoring
        this._contextRestore();

        this.getEventManager().trigger(EasySketch.Sketch.NOTIFY_STOP_EVENT);

        return this;
    },

    /**
     *
     * @param {Array} pointsArray
     * @returns {EasySketch.Sketch}
     */
    drawLine: function (pointsArray) {
        var points = pointsArray.slice();
        var coordinates = points.shift();

        // Executing the drawing operations
        this._contextSetup();

        // Configuring the pen
        if (this.eraser) {
            // We do a save first to keep the previous globalCompositionOperation
            this.context.save();
            this.context.strokeStyle = "rgba(0,0,0,1)";
            this.context.globalCompositeOperation = "destination-out";
        }

        this.context.beginPath();
        this.context.moveTo(coordinates.x, coordinates.y);
        while (points.length > 0) {
            coordinates = points.shift();
            this.context.lineTo(coordinates.x, coordinates.y);
        }
        this.context.stroke();

        // Restoring the globalCompositeOperation
        if (this.eraser) {
            this.context.restore();
        }

        this._contextRestore();

        return this;
    },

    /**
     *
     * @returns {EasySketch.Sketch}
     */
    clear: function () {
        this.context.clearRect(0, 0, this.canvas[0].width, this.canvas[0].height);

        return this;
    }
};


