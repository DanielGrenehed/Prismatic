
function fixedLengthNumberString(n, l) {
	let str = n.toString();
	for (let i = str.length; i < l; i++) {
		str = "0" + str;
	}
	return str;
}

function dateString() {
	let t = new Date();
	return t.getDate()+"-"+
		(t.getMonth()+1)+"-"+
		t.getFullYear()+" "+
		t.getHours()+":"+
		fixedLengthNumberString(t.getMinutes(), 2)+":"+
		fixedLengthNumberString(t.getSeconds(), 2);
}

function tlog(str) {
	console.log(
		dateString()+" "+
		str);
}

function labeledLog(label) {	
	function log(o, msg="") {
		console.log(`\x1b[36m⬐ ${label}\x1b[0m ${msg}`);
		console.log(o);
	};
	return log;
}

module.exports = {tlog, dateString, labeledLog};
