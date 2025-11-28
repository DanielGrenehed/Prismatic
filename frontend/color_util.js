
function toHex(v) {
	let l = Math.floor(v).toString(16)
	for (let i = l.length; i < 2; i++) {
		l= '0'+l
	}
	return l;
}

function colorToString(rgb) {
	let color = "#" + 
		toHex(rgb[0]) + 
		toHex(rgb[1]) + 
		toHex(rgb[2]);
	return color.toUpperCase();
}

function isHexColor(hex) {
  if (typeof(hex) != "string") return false;
	if (!hex.match("#[A-Fa-f0-9]{6}")) return false;
  return true;
}

function stringToColor(hex) {
  if (!isHexColor(hex)) return null;
	return [
		parseInt(hex.substring(1,3), 16), 
		parseInt(hex.substring(3,5), 16), 
		parseInt(hex.substring(5,7), 16)
	];
}

function HSVToRGB(hsv) { // Hue, Saturation, Brightness/Value
	let h=hsv[0], s=hsv[1], v=hsv[2];
	let r, g, b;
	let i = Math.floor(h*6);
	let f = h * 6 - i;
	let p = v * (1 - s);
	let q = v * (1 - f * s);
	let t = v * (1 - (1 - f) * s);
	
	switch (i%6) {
		case 0: r=v,g=t,b=p; break;
		case 1: r=q,g=v,b=p; break;
		case 2: r=p,g=v,b=t; break;
		case 3: r=p,g=q,b=v; break;
		case 4: r=t,g=p,b=v; break;
		case 5: r=v,g=p,b=q; break;
	}
	return [r*255,g*255,b*255];
}

function RGBToHSV(rgb) {
	let r=rgb[0]/255,g=rgb[1]/255,b=rgb[2]/255;
	let max = Math.max(r,g,b), min = Math.min(r,g,b);
	let h,s,v=max;
	let d = max - min;
	s = max == 0 ? 0 : d / max;
	if (max == min) {
		h = 0;
	} else {
		switch(max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return [h,s,v];
}

function RGBToCMY(rgb) {
  const c=255-rgb[0],m=255-rgb[1],y=255-rgb[2];
  return [c,m,y];
}

function CMYToRGB(cmy) {
  const r=255-cmy[0],g=255-cmy[1],b=255-cmy[2];
  return [r,g,b];
}

export {HSVToRGB, RGBToHSV, RGBToCMY, CMYToRGB, colorToString, stringToColor, isHexColor}
