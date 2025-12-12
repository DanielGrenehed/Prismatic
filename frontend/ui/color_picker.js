import {Slider} from './slider';
import {createChild, createTabbedContainer, newElement} from './elementUtil';
import {HSVToRGB, RGBToHSV, RGBToCMY, CMYToRGB, colorToString, stringToColor, isHexColor} from './colorUtil';


let swatches = [];

let pickers = [];
let on_swatches_callback=(_)=>{};
let global_swatch_watchers= [];

function __addSwatch(swatch) {
  if (Array.isArray(swatch)) {
    swatch.forEach((s) => __addSwatch(s));
    return;
  }
  if (!swatches.includes(swatch)) {
    swatches.push(swatch);
  }
}

function setSwatchWatcher(cb) {
  on_swatches_callback = cb;
}

function addGlobalSwatchWatcher(cb) {
  global_swatch_watchers.push(cb);
}

function handlePickers() {
  pickers = pickers.filter((p) => p.container.isConnected);
}

function setGlobalSwatches(s) {
  swatches = [];
  handlePickers();
  __addSwatch(s);
  pickers.forEach((p) => {
    p.clearSwatches();
    p.addSwatches(swatches);
  });
  global_swatch_watchers.forEach((cb) => cb(swatches));
}

function getGlobalSwatches() {
  return swatches;
}

function removeGlobalSwatches(s) {
  if (!Array.isArray(s)) s = [s];
  swatches = swatches.filter((clr) => !s.includes(clr));
  pickers.forEach((p) => {
    p.clearSwatches();
    p.addSwatches(swatches);
  });
  if (on_swatches_callback) on_swatches_callback(swatches);
}

function addGlobalSwatches(swatch) {
  let l = swatches.length;
  handlePickers();
  pickers.forEach((p) => p.addSwatches(swatch));
  __addSwatch(swatch);
  if (l !== swatches.length && on_swatches_callback) on_swatches_callback(swatches);
}

function addPicker(picker) {
  if (!pickers.includes(picker)) {
    pickers.push(picker);
    picker.addSwatches(swatches);
  }
}

class ColorPicker {
	constructor(callback) {
		this.callback = callback;
		this.container = newElement("", ["color-picker"]);
		this.rgb = [0,0,0];
		this.hsv = RGBToHSV(this.rgb);
    this.cmy = RGBToCMY(this.rgb);

		this.hsv_container = newElement("", ["grid-column"]);
		this.rgb_container = newElement("", ["grid-column"]);
    this.cmy_container = newElement("", ["grid-column"]);
    this.swatch_container = newElement("", ["grid-column", "swatch-container"]);
		this.sliders = {};
    this.swatches = [];

		let o = this;
		let updateColor = () => {
			let c = o.color;
			o.updateValues();
			if (c != o.color) {
				callback(o);
			}
		}
    
    // create hsv sliders
    const updateFromHSV = () => {
      o.rgb = HSVToRGB(o.hsv);
      o.cmy = RGBToCMY(o.rgb);
      updateColor();
    };
		this.sliders.hue = new Slider("Hue", 360, (v) => {
			o.hsv[0] = v/360;
      updateFromHSV();
		});
    this.sliders.hue.scroll_multiplier = 1.5;
		this.hsv_container.appendChild(this.sliders.hue.container);
		this.sliders.hue.slider.classList.add("hue");

		this.sliders.sat = new Slider("Saturation", 100, (v) => {
			o.hsv[1] = v/100;
      updateFromHSV();
		});
		this.hsv_container.appendChild(this.sliders.sat.container);

		this.sliders.bri = new Slider("Brightness", 100, (v) => {
			o.hsv[2] = v/100;
      updateFromHSV();
		});
		this.hsv_container.appendChild(this.sliders.bri.container);

    // create rgb sliders
    const updateFromRGB = () => {
      o.hsv = RGBToHSV(o.rgb);
      o.cmy = RGBToCMY(o.cmy);
      updateColor();
    };   
		this.sliders.red = new Slider("Red", 255, (v) => {
			o.rgb[0] = v;
      updateFromRGB();
		});
		this.rgb_container.appendChild(this.sliders.red.container);

		this.sliders.green = new Slider("Green", 255, (v) => {
			o.rgb[1] = v;
      updateFromRGB();
		});
		this.rgb_container.appendChild(this.sliders.green.container);

		this.sliders.blue = new Slider("Blue", 255, (v) => {
			o.rgb[2] = v;
      updateFromRGB();
		});
		this.rgb_container.appendChild(this.sliders.blue.container);

    // create cmy sliders
    const updateFromCMY = () => {
      o.rgb = CMYToRGB(o.cmy);
      o.hsv = RGBToHSV(o.rgb);
      updateColor();
    };
    this.sliders.cyan = new Slider("Cyan", 255, (v) => {
      o.cmy[0] = v;
      updateFromCMY();
    });
    this.cmy_container.appendChild(this.sliders.cyan.container);
    this.sliders.cyan.slider.style.background = "linear-gradient(to right,#FFFFFF,#00FFFF)";

    this.sliders.magenta = new Slider("Magenta", 255, (v) => {
      o.cmy[1] = v;
      updateFromCMY();
    });
    this.cmy_container.appendChild(this.sliders.magenta.container);
    this.sliders.magenta.slider.style.background = "linear-gradient(to right,#FFFFFF,#FF00FF)";

    this.sliders.yellow = new Slider("Yellow", 255, (v) => {
      o.cmy[2] = v;
      updateFromCMY();
    });
    this.cmy_container.appendChild(this.sliders.yellow.container);
    this.sliders.yellow.slider.style.background = "linear-gradient(to right,#FFFFFF,#FFFF00)";
    // create swatches
    // @TODO

		this.preview_container = newElement("", ["color-preview-container"]);
		this.preview = createChild(this.preview_container, "color-preview");
		this.preview.addEventListener("click", (e) => {
      addGlobalSwatches(o.color);
    });
		this.value_input = newElement("", ["value-input"]);
		this.value_input.contentEditable = true;
		this.value_input.spellcheck = false;
		this.value_input.addEventListener("keydown", (evt) => {
			if (evt.keyCode === 13) {
				evt.preventDefault();
				o.setValue(o.value_input.innerHTML);
				callback(o);
			}
		});
		
		this.tabbed_container = createTabbedContainer(["HSV","RGB", "CMY","Swatches"], (tab) =>  {o.updateValues();});
		this.tabbed_container.tabs.HSV.appendChild(this.hsv_container);
		this.tabbed_container.tabs.RGB.appendChild(this.rgb_container);
    this.tabbed_container.tabs.CMY.appendChild(this.cmy_container);
    this.tabbed_container.tabs.Swatches.appendChild(this.swatch_container);
		
		this.container.appendChild(this.tabbed_container);
		this.preview_container.appendChild(this.value_input);
    
		this.container.appendChild(this.preview_container);
		this.updateValues();
    addPicker(this);
	}

	updateHSV() {
		this.sliders.hue.setValue(Math.round(this.hsv[0]*360));
		this.sliders.sat.setValue(Math.round(this.hsv[1]*100));
		const s1 = colorToString(HSVToRGB([this.hsv[0], 0, this.hsv[2]]));
		const s2 = colorToString(HSVToRGB([this.hsv[0], 1, this.hsv[2]]));
		this.sliders.sat.slider.style.background = "linear-gradient(to right,"+s1+","+s2+")";
		
		this.sliders.bri.setValue(Math.round(this.hsv[2]*100));
		const v1 = colorToString(HSVToRGB([this.hsv[0],this.hsv[1],0]));
	  const v2 = colorToString(HSVToRGB([this.hsv[0],this.hsv[1],1]));
		this.sliders.bri.slider.style.background = "linear-gradient(to right,"+v1+","+v2+")";
	}

	updateRGB() {
		const r = this.rgb[0], g = this.rgb[1], b = this.rgb[2];
		this.sliders.red.setValue(r);
		const r1 = colorToString([0,g,b]);
		const r2 = colorToString([255,g,b]);
		this.sliders.red.slider.style.background = "linear-gradient(to right,"+r1+","+r2+")";

		this.sliders.green.setValue(g);
		const g1 = colorToString([r,0,b]);
		const g2 = colorToString([r,255,b]);
		this.sliders.green.slider.style.background = "linear-gradient(to right,"+g1+","+g2+")";

		this.sliders.blue.setValue(b);
		const b1 = colorToString([r,g,0]);
		const b2 = colorToString([r,g,255]);
		this.sliders.blue.slider.style.background = "linear-gradient(to right,"+b1+","+b2+")";
	}

  updateCMY() {
    const c = this.cmy[0], m = this.cmy[1], y = this.cmy[2];
    this.sliders.cyan.setValue(c);
    this.sliders.magenta.setValue(m);
    this.sliders.yellow.setValue(y);
  }

	updateValues() {
		this.color = colorToString(this.rgb);
		this.preview.style.background = this.color;
		this.container.style.outlineColor = this.color;
		this.value_input.innerHTML = this.color;
		this.updateHSV();
		this.updateRGB();
    this.updateCMY();
	}

	setValue(clr) {
		const rgb = stringToColor(clr);
		if (!rgb) return;
		this.rgb = rgb;
		this.hsv = RGBToHSV(this.rgb);
    this.cmy = RGBToCMY(this.rgb);
		this.updateValues();
	}

	setRGB(rgb) {
		if (!rgb || rgb.length < 3) return;
		this.rgb = rgb;
		this.hsv = RGBToHSV(this.rgb);
    this.cmy = RGBToCMY(this.rgb);
		this.updateValues();
	}

  setCMY(cmy) {
    if (!cmy || cmy.length < 3) return;
    this.cmy = cmy;
    this.rgb = CMYToRGB(this.cmy);
    this.hsv = RGBToHSV(this.rgb);
    this.updateValues();
  }

  addSwatches(s) {
    let o = this;
    if (Array.isArray(s)) {
      s.forEach((swatch) => o.addSwatches(swatch));
      return;
    }
    if (!isHexColor(s)) {
      console.error(`Tried to add '${s}' to swatches, was neglected!`);
      return;
    }
    if (!this.swatches.includes(s)) {
      this.swatches.push(s);
      let swatch = newElement("", ["swatch"]);
      swatch.style.backgroundColor = s;
      swatch.addEventListener("click", (e) => {
        if (e.ctrlKey && e.shiftKey) {
          removeGlobalSwatches(s);
          return;
        }
        o.rgb = stringToColor(s);
        o.cmy = RGBToCMY(o.rgb);
        o.hsv = RGBToHSV(o.rgb);
        let c = o.color
        o.updateValues();
        if (o.color !== c && o.callback) o.callback(o);
      });
      this.swatch_container.appendChild(swatch);
    }
  }

  clearSwatches() {
    this.swatch_container.innerHTML = "";
    this.swatches = [];
  }

	redraw() {
		this.updateValues();
	}
}

export {ColorPicker, setGlobalSwatches, getGlobalSwatches, addGlobalSwatchWatcher, addGlobalSwatches, setSwatchWatcher}; 
