import {getMenu, refreshUI} from './ui';
import {Slider} from './slider';
import {createTabbedContainer, newElement, withLabel, floatLineDisplay, createLabel} from './elementUtil';
import {createFixtureUI} from './fixtures';
import {HSVToRGB, colorToString} from './colorUtil';
import {stage} from './updater';

let gamepads = {};

let tabbed_container = null;

let views = {};

let moving_fixtures = []; 


function beforeLast(s, d) {
  const i = s.lastIndexOf(d);
  if (i === -1) return s;
  return s.substring(0, i);
}

function getColor(id) {
  let str = beforeLast(id, '-');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  const f = (hash >>> 0) / 2**32;
  return colorToString(HSVToRGB([f, 0.8, 1]));
} 

function getName(gamepad) {
  return `${gamepad.index}_${gamepad.id}`;
}

function showControllerMenu() {
  if (Object.keys(gamepads).length > 0) {
    getMenu('controller').button.classList.remove('hidden');
  } else {
    getMenu('controller').button.classList.add('hidden');
  }
}

function pollGamepads() {
    if (Object.keys(gamepads).length > 0) {
      let gps = navigator.getGamepads().filter((g) => g!==null);
      gps.forEach((gamepad) => {
        let id = getName(gamepad);
        gamepad.axes.forEach((v, i) => {
          views[id]?.axes[i]?.updatePosition(v);
        });
        views[id]?.handleAxesCallback(gamepad.axes);
        gamepad.buttons.forEach((b, i) => {
          const active = b.value ? true : false;
          if (views[id]?.buttons[i]?.active !== active) {
            views[id]?.buttons[i]?.setActive(active);
            views[id]?.buttonChangeCallback(i, active);
          }
        });
      });

      setTimeout(()=>{
        requestAnimationFrame(pollGamepads);
      }, 10);
    }
}

const input_ui_channels = new Set([
  "pan", "fine_pan",
  "tilt", "fine_tilt",
  "zoom", "fine_zoom",
  "focus", "fine_focus",
]);

function createGamepadUI(gamepad) {
  const id = getName(gamepad);
  let view = tabbed_container.addTab(id);
  view.color = getColor(id);
  console.log("Color: ", view.color);
  view.classList.add("grid-row");
  view.axes = [];
  view.buttons = [];
  let info_container = newElement("", ["grid-row"]);
  let axes = newElement("", []);
  let buttons = newElement("", ["grid-row"]);
  view.appendChild(info_container);
  info_container.appendChild(axes);
  info_container.appendChild(buttons);
  let input_container = newElement("", ["grid-column", "gap"]);
  view.appendChild(input_container);
  gamepad.axes.forEach((axis, i) => {
    let display = floatLineDisplay("Axis "+ (i+1).toString())
    display.setColor(view.color);
    view.axes.push(display);
    axes.appendChild(display);
  });
  gamepad.buttons.forEach((button, i) => {
    let display = createLabel("b" + (i+1).toString());
    view.buttons.push(display);
    buttons.appendChild(display);
  });
  view.buttonChangeCallback = (button, pressed) => {
    // @TODO fix mapping depending on browser and "mapping"
    switch (button) {
      case 4:
      case 14:
        if (pressed) views[id].prev();
        break;
      case 5:
      case 15:
        if (pressed) views[id].next();
        break;
      case 12:
        if (pressed) views[id].prev(3);
        break;
      case 13:
        if (pressed) views[id].next(3);
        break;
    }
  };
  view.old_controller = gamepad.axes.length <= 6;
  view.handleAxesCallback = (axes) => {
    // @TODO fix mapping depending on browser and "mapping"
    const rx = -axes[0];
    const ry = axes[1];
    const lx = view.old_controller ? axes[2] : axes[4]; 
    const ly = view.old_controller ? axes[3] : axes[5];
    let la = view.old_controller ? axes[5] : axes[6];
    let ra = view.old_controller ? axes[4] : axes[7];
    if (axes.length == 4) {
      la = gamepad.buttons[7].pressed ? 1 : -1;
      ra = gamepad.buttons[6].pressed ? 1 : -1;
    }
    if (ra === 0) ra = -1;
    if (la === 0) la = -1;
    const min = 0.01;
    const max = 1.0;
    let rscale =min+ (max-min) * (1.0 + ra);
    let lscale =min+ (max-min) * (1.0 + la);

    const center = 0.1;
    let fixture = view.getSelected();
    if (!fixture) return;
    let c = 0;
    if (rx > center || rx < -center) {
      if (fixture.pan(rx*rscale)) c++;
    }
    if (ry > center || ry < -center) {
      if (fixture.tilt(ry*rscale)) c++;
    }
    if (lx > center || lx < -center) {
      if (fixture.focus(lx*lscale)) c++;
    }
    if (ly > center || ly < -center) {
      if (fixture.zoom(ly*lscale)) c++;
    }
    if (c>0) {
      refreshUI();
      stage(fixture);
    }
  };
  view.selected = 0;
  view.fix_cb = (fixture) => {
  }; 
  view.select = (id) => {

    input_container.innerHTML = "";
    view.getSelected().fixture_ui.removeColor(view.color);
    view.getSelected().removeChannelUpdateCallback(view.fix_cb);
    const n = moving_fixtures.length;
    if (id < 0) id = n - (Math.abs(id) % n);
    view.selected = (id)%moving_fixtures.length;
    view.getSelected().fixture_ui.addColor(view.color);
    view.getSelected().addChannelUpdateCallback(view.fix_cb);

    let channels = view.getSelected().channel_names;
    if (!channels) return ;
    channels = channels.filter((c) => input_ui_channels.has(c));
    view.sliders = [];
    channels.forEach((channel) => {
      let slider = new Slider(channel, 255, (v) => {
        let fixture = view.getSelected();
        fixture.updateChannels([{p:channel,v:v}]);
        stage(fixture);
      });
      slider.channel = channel;
      view.sliders.push(slider);
      input_container.appendChild(slider.container);
      view.redraw();
    });
  };
  view.next = (n=1) => {
    view.select(view.selected+n);
  };
  view.prev = (n=1) => {
    view.select(view.selected-n);
  };
  view.unselect = () => {
    view.getSelected().fixture_ui.removeColor(view.color);
  };
  view.getSelected = () => {
    return moving_fixtures[view.selected];
  };
  view.redraw = () => {
    if (!view.sliders) return;
    view.sliders.forEach((slider) => {
      let fixture = view.getSelected();
      if (!fixture) return;
      let v = fixture.getChannelValues([slider.channel])[0];
      slider.setValue(v);
      slider.redraw();
    });
  };
  view.select(view.selected);
  views[id] = view;
}

window.addEventListener("gamepadconnected", (event) => {
  gamepads[getName(event.gamepad)] = event.gamepad;
  pollGamepads();
  showControllerMenu();
  createGamepadUI(event.gamepad);

  console.log("Gamepad connected:", gamepads[getName(event.gamepad)], "mapping:", event.gamepad.mapping);
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("Gamepade disconnected:", event.gamepad);
  delete gamepads[getName(event.gamepad)];
  showControllerMenu();
  views[getName(event.gamepad)].unselect();
  tabbed_container.removeTab(getName(event.gamepad));
  delete views[getName(event.gamepad)];
});

function constructControllerUI(fixtures) {
  let controller = getMenu("controller");
  if (!tabbed_container) {
    let infodiv = document.getElementById("d-controller-info");
    infodiv.innerHTML = "";
    tabbed_container = createTabbedContainer([], (tab) => {});
    infodiv.appendChild(tabbed_container);
  }
  if (!fixtures) return;

  moving_fixtures = fixtures.filter((fixture) => {
    if (fixture.channel_names.includes("pan")) return true;
    if (fixture.channel_names.includes("tilt")) return true;
    if (fixture.channel_names.includes("zoom")) return true;
    if (fixture.channel_names.includes("focus")) return true;
    return false;
  }) || [];

  let fixture_select_container = document.getElementById("d-controller-fixture-container"); 
  fixture_select_container.innerHTML = "";
  controller.redraw = () => {
    Object.entries(views).forEach(([key, view]) => {
      view.redraw();
    });
  };
  controller.updateView = (fixture = null) => {
    controller.redraw();
  };
  moving_fixtures.forEach((fixture, i) => {
    let fixture_container = createFixtureUI(fixture, controller.updateView);
    fixture_select_container.appendChild(fixture_container);
    controller.ui_elements.push(fixture_container);
    fixture.fixture_ui = fixture_container;
  });
  Object.entries(views).forEach(([k,v]) => {
    v.select(v.selected);
  });
}

export {constructControllerUI};
