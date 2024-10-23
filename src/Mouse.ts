
// Shamelessly stolen from Nicky Case's "The Wisdom and Madness of Crowds."

/////////////////////////////
// MOUSE ////////////////////
/////////////////////////////
import {publish} from "./minpubsub"
import { Vector2 } from "./Vector2";

export var Mouse = {
	x:0, y:0,
	pressed:false,
	justPressed: false,
	justReleased: false,
	lastX: 0,
	lastY: 0,
	lastPressed: false,

	getScenePos(): Vector2 {
		return Vector2.fromCanvasSpace(new Vector2(Mouse.x, Mouse.y))
	},

	getLastScenePos(): Vector2 {
		return Vector2.fromCanvasSpace(new Vector2(Mouse.lastX, Mouse.lastY))
	},

	ondown(event?: any) {
		Mouse.pressed = true;
		Mouse.onmove(event);
		publish("mouse/down");
	},

	onmove(event?: any){
		Mouse.x = event.clientX;
		Mouse.y = event.clientY;
		publish("mouse/move");
	},

	onup(_event?: any) {
		Mouse.pressed = false;
		publish("mouse/up");
	},

	update(){

		// Just pressed, or just released (one frame ago)
		Mouse.justPressed = (!Mouse.lastPressed && Mouse.pressed);
		Mouse.justReleased = (Mouse.lastPressed && !Mouse.pressed);
	
		// The last frame's stuff
		Mouse.lastX = Mouse.x;
		Mouse.lastY = Mouse.y;
		Mouse.lastPressed = Mouse.pressed;
	
	},

	// INIT
	init(target: Document){
		console.log('Mouse init!')
		// Regular mouse
		target.addEventListener("mousedown", Mouse.ondown);
		target.addEventListener("mousemove", Mouse.onmove);
		window.addEventListener("mouseup", Mouse.onup);

		// Touch events
		target.addEventListener("touchstart", _touchWrapper(Mouse.ondown), false);
		target.addEventListener("touchmove", _touchWrapper(Mouse.onmove), false);
		document.body.addEventListener("touchend", function(){
			Mouse.onup();
		}, false);
	}
};


// TOUCH.
function _touchWrapper(callback: Function){
	return function(event?: any){
		var _event = {
			clientX: event.changedTouches[0].clientX,
			clientY: event.changedTouches[0].clientY
		};
		
		//event.preventDefault();
		callback(_event);
	};
}

// ALSO DON'T SCROLL WHEN TOUCH
document.body.addEventListener("touchstart", function(e){
    e.preventDefault(); 
},false); // do NOT capture.
document.body.addEventListener("touchmove", function(e){
    e.preventDefault(); 
},false); // do NOT capture.

Mouse.init(document)

