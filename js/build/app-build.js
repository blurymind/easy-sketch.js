/**
 * easy-sketch.js
 *
 * @link https://github.com/brian978/easy-sketch.js
 * @copyright Copyright (c) 2014
 * @license Creative Commons Attribution-ShareAlike 3.0
 */

define("EasySketch/EasySketch",[],function(){function e(){}return e}),define("EasySketch/Event",["./EasySketch"],function(e){return e.Event=function(e,t,n){this.name=e,this.target=t,this.params=n,this._propagationStopped=!1},e.Event.prototype={getName:function(){return this.name},getTarget:function(){return this.target},getParam:function(e,t){return t=t||null,this.params.hasOwnProperty(e)?this.params[e]:t},getParams:function(){return this.params},stopPropagation:function(){return this._propagationStopped=!0,this},isPropagationStopped:function(){return this._propagationStopped}},e.Event}),define("EasySketch/EventManager",["./EasySketch","./Event"],function(e){return e.EventManager=function(){this.events={}},e.EventManager.prototype={_prepareEvent:function(e){return typeof e=="string"&&(e.indexOf(" ")!==-1?e=e.split(" "):e=[e]),e},on:function(e,t){return this.attach(e,t)},attach:function(e,t){var n,r=this._prepareEvent(e);for(var i in r)r.hasOwnProperty(i)&&(n=r[i],this.events.hasOwnProperty(n)===!1&&(this.events[n]=[]),this.events[n].push(t));return this},off:function(e,t){return this.detach(e,t)},detach:function(e,t){var n,r=this._prepareEvent(e);for(var i in r)if(r.hasOwnProperty(i)){n=r[i];if(this.events.hasOwnProperty(n))for(var s in this.events[n])this.events[n].hasOwnProperty(s)&&this.events[n][s]===t&&(this.events[n][s]=null,delete this.events[n][s])}return this},trigger:function(t,n,r){var i=null;if(this.events.hasOwnProperty(t)){i=new e.Event(t,n,r);for(var s in this.events[t])this.events[t].hasOwnProperty(s)&&this.events[t][s].call(null,i)}return i}},e.EventManager}),define("EasySketch/Util",["./EasySketch"],function(e){return e.Util={getScalePropertyName:function(e){var t="",n=e[0].style;if("transform"in n)t="transform";else{var r=["-moz","-webkit","-o","-ms"],i="";for(var s=0;s<r.length;s++){i=r[s]+"-transform";if(i in n){t=i;break}}}return t},getScale:function(e){var t=this.getScalePropertyName(e),n={x:1,y:1};if(t!==null){var r=String(e.css(t));if(r!="none"){var i=new RegExp("([0-9.-]+)","g"),s=r.match(i);n.x=parseFloat(s[0]),n.y=parseFloat(s[3])}}return n}},e.Util}),define("EasySketch/Sketch",["./EasySketch","./EventManager","./Util"],function(e,t,n){return e.Sketch=function(e,n){this.lastMouse={x:0,y:0},this.disabled=!1,this.binded=!1,this.drawing=!1,this.events=new t,this.eraser=!1,this.canvas=this._createCanvas(e),this.context=this.canvas.get(0).getContext("2d"),this.overlay=null,this.overlayContext=null,this.points=[],this.options={color:"#000000",width:5,alpha:1,bindingObject:null,autoBind:!0,doubleBuffering:!1},this.listeners={start:this.startDrawing.bind(this),draw:this.makeDrawing.bind(this),stop:this.stopDrawing.bind(this)},n&&this.setOptions(n),this.options.doubleBuffering===!0&&this._createOverlay(),this.options.autoBind===!0&&this.attachListeners(),this._attachStandardListeners()},e.Sketch.NOTIFY_START_EVENT="notify.start",e.Sketch.NOTIFY_PAINT_EVENT="notify.paint",e.Sketch.NOTIFY_STOP_EVENT="notify.stop",e.Sketch.prototype={selectContext:function(){return this.options.doubleBuffering===!0&&this.eraser===!1?this.overlayContext:this.context},selectCanvas:function(){return this.options.doubleBuffering===!0?this.overlay:this.canvas},setOptions:function(e){return this.options=$.extend(this.options,e||{}),this},setOption:function(e,t){return typeof e=="string"&&this.options.hasOwnProperty(e)&&(this.options[e]=t),this},getOption:function(e,t){return t=t||null,this.options.hasOwnProperty(e)?this.options[e]:t},getEventManager:function(){return this.events},_createCanvas:function(e){var t,n=typeof e;switch(n){case"string":e.indexOf("#")===0?t=$(e):e.indexOf(".")===-1&&(t=$("#"+e));break;case"object":e instanceof jQuery?t=e:t=$(e)}return t.css("position").indexOf("absolute")===-1&&t.css("position","absolute"),isNaN(parseInt(t.css("top")))&&t.css("top",0),isNaN(parseInt(t.css("left")))&&t.css("left",0),t},_createOverlay:function(){this.canvas.parent().css("position","relative");var e=$("<canvas></canvas>");return e.addClass("drawing-overlay"),e.attr("width",this.canvas.attr("width")),e.attr("height",this.canvas.attr("height")),e.css("position","absolute"),e.css("top",this.canvas.css("top")),e.css("left",this.canvas.css("top")),this.canvas.after(e),this.options.bindingObject=e,this.overlayContext=e.get(0).getContext("2d"),this.overlay=e,this},_autoAdjustOverlay:function(){if(this.overlay!==null){var e=n.getScale(this.canvas);this.overlay.attr("width",this.canvas.attr("width")),this.overlay.attr("height",this.canvas.attr("height")),this.overlay.css("position","absolute"),this.overlay.css("top",this.canvas.css("top")),this.overlay.css("left",this.canvas.css("top")),this.overlay.css(n.getScalePropertyName(this.canvas),"scale("+e.x+", "+e.y+")")}return this},_attachStandardListeners:function(){return this.canvas.on("DOMAttrModified",this._autoAdjustOverlay.bind(this)),this},attachListeners:function(){if(this.binded===!0)return this;this.binded=!0;var e;return this.getOption("bindingObject")!==null?e=this.options.bindingObject:e=this.canvas,e.on("mousedown touchstart",this.listeners.start),e.on("mousemove touchmove",this.listeners.draw),e.on("mouseup mouseleave mouseout touchend touchcancel",this.listeners.stop),this},detachListeners:function(){if(this.binded===!1)return this;this.binded=!1;var e;return this.getOption("bindingObject")!==null?e=this.options.bindingObject:e=this.canvas,e.off("mousedown touchstart",this.listeners.start),e.off("mousemove touchmove",this.listeners.draw),e.off("mouseup mouseleave mouseout touchend touchcancel",this.listeners.stop),this},getPointerPosition:function(e){var t=this,r=n.getScale(this.selectCanvas());return e.hasOwnProperty("originalEvent")&&e.originalEvent.hasOwnProperty("targetTouches")&&(e.pageX=e.originalEvent.targetTouches[0].pageX,e.pageY=e.originalEvent.targetTouches[0].pageY),{x:Math.ceil((e.pageX-t.canvas.offset().left)/r.x),y:Math.ceil((e.pageY-t.canvas.offset().top)/r.y)}},enableEraser:function(e){return this.eraser=e,this},contextSetup:function(e){return e=e||this.selectContext(),e.save(),e.strokeStyle=this.options.color,e.lineWidth=this.options.width,e.globalAlpha=this.options.alpha,e.lineCap="round",e.lineJoin="round",this},contextRestore:function(e){return e=e||this.selectContext(),e.restore(),this},startDrawing:function(t){if(this.drawing===!0||this.disabled===!0)return this;t.preventDefault();var n=this.getPointerPosition(t);return this.drawing=!0,this.lastMouse=n,this.contextSetup(),this.options.doubleBuffering===!0&&this.eraser===!1&&this.points.push(n),this.getEventManager().trigger(e.Sketch.NOTIFY_START_EVENT,this,[n]),this},makeDrawing:function(t){if(this.drawing===!1||this.disabled===!0)return this;t.preventDefault();var n=this.getPointerPosition(t);return this.drawPoints([this.lastMouse,n],this.selectContext()),this.lastMouse=n,this.options.doubleBuffering===!0&&this.eraser===!1&&(this.points.push(n),this.redrawBuffer()),this.getEventManager().trigger(e.Sketch.NOTIFY_PAINT_EVENT,this,[n]),this},stopDrawing:function(){return this.drawing===!1?this:(this.drawing=!1,this.canvas.css("cursor","auto"),this.contextRestore(),this.options.doubleBuffering===!0&&this.eraser===!1&&(this.drawLine(this.points),this.points=[],this.clearOverlay()),this.getEventManager().trigger(e.Sketch.NOTIFY_STOP_EVENT,this),this)},redrawBuffer:function(){return this.clearOverlay(),this.drawPoints(this.points,this.overlayContext),this},drawPoints:function(e,t){e=e.slice();var n=e.shift();this.eraser&&(t.save(),t.strokeStyle="rgba(0,0,0,1)",t.globalAlpha=1,t.globalCompositeOperation="destination-out"),t.beginPath(),t.moveTo(n.x,n.y);while(e.length>0)n=e.shift(),t.lineTo(n.x,n.y);return t.stroke(),t.closePath(),this.eraser&&t.restore(),this},drawLine:function(e){var t=this.context;return this.contextSetup(t),this.drawPoints(e,t),this.contextRestore(t),this},clear:function(){return this.context.clearRect(0,0,this.canvas[0].width,this.canvas[0].height),this},clearOverlay:function(){return this.overlayContext instanceof CanvasRenderingContext2D&&this.overlayContext.clearRect(0,0,this.overlay[0].width,this.overlay[0].height),this}},e.Sketch}),requirejs(["EasySketch/Sketch"],function(e){var t=new e("#drawing-canvas",{doubleBuffering:!0});$("#pencil").on("click",function(){t.enableEraser(!1)}),$("#eraser").on("click",function(){t.enableEraser(!0)}),$("#clear").on("click",function(){t.clear()}),$("#line-width-control").on("change",function(){var e=$(this).val();t.setOptions({width:e}),$(".line-width-controls").find(".info").html(e+"px")}),$("#line-color-control").on("change",function(){var e=$(this).val();t.setOptions({color:e})}),$("#line-opacity-control").on("change",function(){var e=$(this).val();t.setOptions({alpha:e}),$(".line-opacity-controls").find(".info").html(e*100+"%")});var n=t.getOption("color");t.context.font="normal 20px Calibri",t.context.fillText("Default brush color: "+n,200,50),t.setOptions({alpha:.1}),t.drawLine([{x:20,y:10},{x:40,y:100},{x:60,y:10}]),t.drawLine([{x:5,y:10},{x:15,y:50},{x:30,y:10}]),t.setOptions({alpha:1}),t.getEventManager().attach(e.NOTIFY_PAINT_EVENT,function(e){console.log("drawing at "+JSON.stringify(e.getParam(0)))})}),define("Main/app",function(){});