import {remap, squish} from './math';
import {createChild, createLabel} from './elementUtil';

class Slider {
	constructor(label, maxValue, callback, vertical=false) {
		this.container = createLabel(label);
		this.container.classList.add("input-component");
		this.container.classList.add(vertical ? "stacked" : "slider-size");

		this.value_input = document.createElement("div");
		this.value_input.contentEditable = true;
		this.value_input.classList.add("value-input");
		this.container.appendChild(this.value_input);

		this.slider = createChild(this.container, [vertical ? "vslider" : "slider"]);
		this.picker = this.slider.getElementsByClassName("slider-picker");
		this.picker = this.picker.length < 1 ? createChild(this.slider, "slider-picker") : this.picker[0];
		this.vertical = vertical;
		this.max_value = maxValue;
		this.callback = callback;
    this.scroll_multiplier = 1.0;
		
		let o = this;
		function tc(e) {o.touch_callback(e);}
		this.slider.addEventListener("touchstart", tc);
		this.slider.addEventListener("touchend", tc);
		this.slider.addEventListener("touchcancel", tc);
		this.slider.addEventListener("touchmove", tc);

		function mc(e) {o.mouse_callback(e);}
    this.slider.addEventListener("mouseup", mc);
		this.slider.addEventListener("mousedown", mc);
		this.slider.addEventListener("mousemove", mc);
    this.slider.addEventListener("mouseleave", mc);
		this.slider.addEventListener("click", mc);

    function sc(e) {o.scroll_callback(e);}
    this.slider.addEventListener("scroll", sc);
    this.slider.addEventListener("wheel", sc);

		this.value_input.addEventListener("keydown", (e) => {
			if (e.keyCode === 13) {
				e.preventDefault()
				let v = parseInt(this.value_input.innerHTML);
				if (v != undefined) {
					v = squish(0, this.max_value, v);
					this.setValue(v);
					this.callback(v);
				}
			}
		});

		this.setValue(0);
	}

	calcSize() {
		if (this.vertical) {
			return this.slider.clientHeight - this.picker.offsetHeight;
		} else {
			return this.slider.clientWidth - this.picker.offsetWidth;
		}
	}

	calcVal(pos) {
		if (this.vertical) return remap(0, this.calcSize(), this.max_value, 0, pos);
		else return remap(0, this.calcSize(), 0, this.max_value, pos);
	}

	calcNormal() {
		return remap(0, this.max_value, 0, 1, this.value);
	}

	updateValues() {
		let n = this.calcNormal();
		let size = this.calcSize();
		if (this.max_value > 1) {
			this.value_input.innerHTML = Math.round(this.value);
		} else {
			this.value_input.innerHTML = this.value.toFixed(2);
		}
		let pic_pos = this.vertical ? remap(0,1,size,0,n) : remap(0,1,0,size,n);
		if (this.vertical) {
			this.picker.style.top = pic_pos + "px";
		} else {
			this.picker.style.left = pic_pos + "px";
		}
	}

	setValue(v) {
    if (Array.isArray(v) && v.length > 0) v = v[0];
    //console.log("setValue: ", v);
		let vf = parseFloat(v);
		if (vf === undefined) {
			console.log("slider v: ", v," vf",vf," slider:",s);
			return;
		}
		this.value = squish(0, this.max_value, vf);
		this.updateValues();
	}

	redraw() {
		//this.updateValues();
	}

	touch_callback(e) {
		e.preventDefault();
		if (e.targetTouches.length > 0) {
			let t = e.targetTouches[0];

			let b = this.slider.getBoundingClientRect();
			let pos = this.vertical ? t.clientY - b.top : t.clientX - b.left;
			pos = squish(0, this.calcSize(), pos);
			this.value = this.calcVal(pos);
			this.updateValues();
			this.callback(this.value);
		}
	}

	mouse_callback(e) {
		e.preventDefault();
		if (e.buttons == undefined || e.buttons != 1) return;
		let pos = this.vertical ? e.layerY : e.layerX;
    if (e.type === "mouseleave") pos = this.vertical ? e.offsetY : e.offsetX;
		let size = this.calcSize();
		pos = squish(0, size, pos);
		this.value = this.calcVal(pos);
		this.updateValues();
		this.callback(this.value);
	}

  scroll_callback(e) {
    let d = -e.deltaY;
    if (d === 0) return;
    if (d < 0) d = -1;
    if (d > 0) d = 1;
    d *= this.scroll_multiplier;
    let delta = d * (e.shiftKey ? 3 : 1);
    this.setValue(this.value+delta);
    if (this.callback) this.callback(this.value);
    e.preventDefault();
  }
}

export {Slider};
