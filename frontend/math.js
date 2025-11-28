
function lerp(a, b, t) {
	return (1.0-t)*a+b*t;
}

function invlerp(a, b, v) {
	return (v-a)/(b-a);
}

function remap(im, ix, om, ox, v) {
	return lerp(om, ox, invlerp(im, ix, v));
}

function squish(min, max, v) {
	if (v<min) {return min;}
	if (v>max) {return max;}
	return v;
}

export {lerp, invlerp, remap, squish}
