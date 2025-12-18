import {newElement} from './elementUtil';

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
  global_swatch_watchers.forEach((cb) => cb(swatches));
}

function addGlobalSwatches(swatch) {
  let l = swatches.length;
  handlePickers();
  pickers.forEach((p) => p.addSwatches(swatch));
  __addSwatch(swatch);
  if (l !== swatches.length && on_swatches_callback) on_swatches_callback(swatches);
  global_swatch_watchers.forEach((cb) => cb(swatches));
}

function addPicker(picker) {
  if (!pickers.includes(picker)) {
    pickers.push(picker);
    picker.addSwatches(swatches);
  }
}

function createSwatchUI(swatch, on_click) {
  let ui = newElement("", ["swatch"]);
  ui.style.backgroundColor = swatch;
  ui.title = swatch;
  if (on_click) ui.addEventListener("click", on_click);
  return ui;
}

export {addPicker, setGlobalSwatches, getGlobalSwatches, addGlobalSwatchWatcher, addGlobalSwatches, removeGlobalSwatches, setSwatchWatcher, createSwatchUI};
