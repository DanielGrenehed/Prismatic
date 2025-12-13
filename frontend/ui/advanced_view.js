import {withLabel, newElement} from './elementUtil';
import {createFixtureUI, getFixtureChannelNames} from './fixtures';
import {Slider} from './slider';
import {ColorPicker} from './colorPicker';
import {stage, handleModifierConflicts} from './updater';
import {refreshUI, getMenu} from './ui';
import {updateMultiverse} from './universe';
import {CMYToRGB, RGBToCMY} from './colorUtil';
import {createLogger} from './util';
const {isLogging, log} = createLogger("advanced");

const COLOR_CHANNELS = ["r","g","b","c","m","y","w", "fine_r","fine_g","fine_b", "fine_c","fine_m","fine_y"];
const POSITION_CHANNELS = ["pan", "tilt", "fine_pan", "fine_tilt"];
const STROBE_DIMMER_CHANNELS = ["strobe", "dimmer", "fine_strobe", "fine_dimmer"];
const ZOOM_FOCUS_CHANNELS = ["zoom", "focus", "fine_zoom", "fine_focus"];

let toggles = {
  color: {active: false, element: document.getElementById("t-cf-color")},
  strobe_dimmer: {active: false, element: document.getElementById("t-cf-sd")},
  position: {active: false, element: document.getElementById("t-cf-pos")},
  gobo: {active: false, element:document.getElementById("t-cf-gobo")},
  zoom_focus: {active: false, element:document.getElementById("t-cf-zf")},
  fine: {active: false, element:document.getElementById("t-cf-fine")},
};


Object.entries(toggles).forEach(([_, t]) => {
  t.element.addEventListener("click", (e) => {
    t.element.classList.toggle("toggled");
    t.active = t.element.classList.contains("toggled");
    getMenu("advanced").updateView();
  });
  t.active = t.element.classList.contains("toggled");
});

document.getElementById("b-cf-clear").addEventListener("click", (e) => {
  Object.entries(toggles).forEach(([_, t]) => {
    t.element.classList.remove("toggled");
    t.active = false;
  });
  getMenu("advanced").updateView();
});

function getUnifiedChannels(channels, fixtures) {
		let channel_values = [];
    fixtures.forEach((f) => {
      const cv = f.getChannelValues(channels);
      if (cv !== null && cv.length > 0) {
        channel_values.push(cv);
      }
    });
		return channel_values;
}

function getSubverses(fs, channels=false) {
	let subverses = [];
  if (channels) {
    fs.forEach((f) => subverses = subverses.concat(f.channelSubverses(channels)));
  } else {
    fs.forEach((f) => subverses.push(f.subverse()));
  }
  log("Fixture subverses:", subverses, "fixtures:", fs) 
	return subverses;
}

function selectedFixtures() {
	let selected = [];
  getMenu("advanced").ui_elements.forEach((f) => {
    if (f.fixture.selected) selected.push(f.fixture);
  });
	return selected;
}

function updateFixtures(vs) {
  let advanced = getMenu('advanced');
  let updates = [];
  let fixtures = selectedFixtures();
  fixtures.forEach((f) => {
    f.updateChannels(vs)
    updates = updates.concat(f.getSubverseUpdates(false));
  });
  //const subverses = fixtures.map((f) => f.subverse());
  updateMultiverse(updates);
  handleModifierConflicts(updates);
  stage(fixtures);
}

function constructNewSceneMenu(on_new_scene) {
  let scene_name = document.getElementById("i-scene-name");

	scene_name.eval = () => {
		if (scene_name.innerText.trim() == "") {
			scene_name.innerHTML = "Scene name";
		}
		return scene_name.innerText.trim();
	};

	scene_name.addEventListener("keydown", (evt) => {
		if (evt.keyCode === 13) {
			evt.preventDefault();
			scene_name.eval();
		}
	});

	let scene_time = document.getElementById("i-transition-time");
	scene_time.time = 1;
	scene_time.setValue = (v) => {
		scene_time.time = v;
		scene_time.innerHTML = v;
	};

	scene_time.eval = () => {
		let v = parseFloat(scene_time.innerText);
		if (typeof(v) != "number") {
			scene_time.setValue(1);
		} else if (v < 0) {
			scene_time.setValue(Math.abs(v));
		}else {
			scene_time.setValue(v);
		}
		return scene_time.time;
	}
	scene_time.setValue(1);
	scene_time.addEventListener("keydown", (evt) => {
		if (evt.keyCode === 13) {
			evt.preventDefault();
			scene_time.eval();	
		}
	});

  let create_scene_button = document.getElementById("b-save-scene");
	create_scene_button.addEventListener('click', () => {
    /*
     *  Get selected channel value subverses
     * */
    let {with_fine_channels} = getSelectedChannels();
		let subverses = getSubverses(selectedFixtures(), with_fine_channels);
		if (subverses.length < 1) {
			return;
		}
    log("Created scene, subverses:", subverses, "channels:", isLogging()?getFixtureChannelNames(subverses):"", "requested channels:", with_fine_channels);
		let scene = {
			type: "scene",
			trigger: "update",
			name: scene_name.eval(),
			time: scene_time.eval(),
			subverses: subverses
		};
		on_new_scene(scene);
	});
}

function getAvailableChannels() {
  let channels = [];
  let selected_fixtures = selectedFixtures();
  getMenu("advanced").updatedSelection(selected_fixtures.length);
  selected_fixtures.forEach((f) => {
    f.channel_names.forEach((channel) => {
      if (!channels.includes(channel)) channels.push(channel);
    });
  });
  return channels;
}

function getSelectedChannels() {
  let channels = getAvailableChannels();

  let no_filters = Object.entries(toggles).reduce((a, [key,t]) => {
    if (key ==="fine") return a;
    return a + t.active?1:0;
  }, 0) < 1;

  
  
  if (!no_filters) {
    let include = [];

    if (toggles.color.active) {
      include = include.concat(COLOR_CHANNELS)
        .concat(channels.filter((c) => c.includes("color")));
    }
    if (toggles.position.active) {
      include = include.concat(POSITION_CHANNELS);
    }
    if (toggles.strobe_dimmer.active) {
      include = include.concat(STROBE_DIMMER_CHANNELS);
    }
    if (toggles.zoom_focus.active) {
      include = include.concat(ZOOM_FOCUS_CHANNELS);
    }
    if (toggles.gobo.active) {
      include = include.concat(["gobo"]).concat(channels.filter((c) => c.includes("gobo") || c.includes("prism")));
    }
    
    channels = channels.filter((c) => include.includes(c));
  }
  let with_fine_channels = channels.map((c) => c);
  if (!toggles.fine.active) {
    channels = channels.filter((c) => !c.includes("fine"));
  }
  return {channels, no_filters, with_fine_channels};
}

function updateView(fixtures) {
  let advanced = getMenu('advanced');
  let {channels, no_filters} = getSelectedChannels();
  advanced.input_container.innerHTML = "";

  advanced.sliders = [];
  if (channels.length < 1) {
    return;
  }

  if (no_filters || toggles.color.active) {
    let color_column = newElement("", ["grid-a", "flex-column", "gap"]);
    advanced.input_container.appendChild(color_column);

    if (["r","g","b"].every(v => channels.includes(v))) {
      
      advanced.rgb_picker = new ColorPicker((cp) => {
        let rgb = cp.rgb;
        updateFixtures([
          {p:"r",v:rgb[0]},
          {p:"g",v:rgb[1]},
          {p:"b",v:rgb[2]}
        ]);
      });
      advanced.rgb_picker.container.classList.add("grid-a");
      advanced.rgb_picker.tabbed_container.openTab("RGB");
      color_column.appendChild(withLabel(advanced.rgb_picker.container, "Channels: R, G, B", false, true));

      channels = channels.filter((c) => !["r","g","b"].includes(c));
    } else {
      advanced.rgb_picker = null;
    }

    if (["c","m","y"].every(v => channels.includes(v))) {
      advanced.cmy_picker = new ColorPicker((cp) => {
        let cmy = RGBToCMY(cp.rgb);
        updateFixtures([
          {p:"c",v:cmy[0]},
          {p:"m",v:cmy[1]},
          {p:"y",v:cmy[2]},
        ]);
      });
      advanced.cmy_picker.container.classList.add("grid-a");
      advanced.cmy_picker.tabbed_container.openTab("CMY");
      color_column.appendChild(withLabel(advanced.cmy_picker.container, "Channels: C, M, Y", false, true));

      channels = channels.filter((c) => !["c","m","y"].includes(c));
    } else {
      advanced.cmy_picker = null;
    }

    channels = channels.filter((c) => {
      if (c.includes("color") || COLOR_CHANNELS.includes(c) ) {
        advanced.addSlider(c, color_column);
        return false;
      } 
      return true;
    });
  }

  let sliders_c = newElement("", ["grid-b","flex-column", "gap"]);

  if (no_filters || toggles.strobe_dimmer) {
    let strobe_dimmer = newElement("",["flex", "flex-column", "channel-group"]);
    let add = false;
    channels = channels.filter((c) => {
      if (STROBE_DIMMER_CHANNELS.includes(c)) {
        advanced.addSlider(c, strobe_dimmer);
        add = true;
        return false;
      }
      return true;
    });
    if (add) sliders_c.appendChild(withLabel(strobe_dimmer, "Strobe/Dimmer", false, true));
  }

  if (no_filters || toggles.position.active) {
    let position = newElement("",["flex", "flex-column", "channel-group"]);
    let add = false;
    channels = channels.filter((c) => {
      if (POSITION_CHANNELS.includes(c)) {
        advanced.addSlider(c, position);
        add = true;
        return false;
      }
      return true;
    });
    if (add) sliders_c.appendChild(withLabel(position, "Position", false, true));     
  }

  if (no_filters || toggles.zoom_focus.active) {
    let zf = newElement("",["flex", "flex-column", "channel-group"]);
    let add = false;
    channels = channels.filter((c) => {
      if (ZOOM_FOCUS_CHANNELS.includes(c)) {
        advanced.addSlider(c, zf);
        add = true;
        return false;
      }
      return true;
    });
    if (add) sliders_c.appendChild(withLabel(zf, "Zoom/Focus", false, true));     
  }

  if (no_filters || toggles.gobo.active) {
    let gobo = newElement("",["flex", "flex-column", "channel-group"]);
    let add = false;
    channels = channels.filter((c) => {
      if (c.includes("gobo") || c.includes("prism")) {
        advanced.addSlider(c, gobo);
        add = true;
        return false;
      }
      return true;
    });
    if (add) sliders_c.appendChild(withLabel(gobo, "Gobo/Prism", false, true));     
  }
  channels.forEach((c) => advanced.addSlider(c, sliders_c));
  advanced.input_container.appendChild(sliders_c);
  advanced.redraw();
}

function constructSelectionMenu() {
  let deselect_all = document.getElementById("b-deselect-all");
  let select_all = document.getElementById("b-select-all");
  let invert_selection = document.getElementById("b-invert-selection");
  let menu_label = document.getElementById("l-selected-count");

  const updatedSelection = (s) => {
    menu_label.innerHTML = "Selected: " + s;
  };
  updatedSelection(0);

	deselect_all.addEventListener('click', () => {
    let advanced = getMenu('advanced');
    advanced.ui_elements.forEach((e) => e.setSelected(false));
		advanced.updateView();
	}); 
	
	select_all.addEventListener('click', () => {
    let advanced = getMenu('advanced');
    advanced.ui_elements.forEach((e) => e.setSelected(true));
		advanced.updateView();
	});

	invert_selection.addEventListener('click', () => {
    let advanced = getMenu('advanced');
    advanced.ui_elements.forEach((e) => e.setSelected(!e.fixture.selected));
		advanced.updateView();
	});
  return {updatedSelection}
}

function constructAdvancedView(fixtures, on_new_scene_cb) {
  let advanced = getMenu('advanced');
  let previously_selected = selectedFixtures();  

  advanced.addSlider = (channel, parent) => {
    let s = new Slider(channel, 255, (v) => updateFixtures([{p:channel,v:v}]));
    parent.appendChild(s.container);
    s.channel = channel;
    advanced.sliders.push(s);
  };

  let input_container = document.getElementById("d-input-container");
  input_container.innerHTML = "";
  advanced.input_container = input_container;

	let {updatedSelection} = constructSelectionMenu();
  advanced.updatedSelection = updatedSelection;
	constructNewSceneMenu(on_new_scene_cb);	
  
  let fixture_select_container = document.getElementById("d-fixture-select-container");
  fixture_select_container.innerHTML = "";

	
	advanced.rgb_picker = null;
	advanced.sliders = [];
	
	advanced.redraw = () => {
    let selected = selectedFixtures();
		if (advanced.rgb_picker != null) {
			let rgb = getUnifiedChannels(["r","g","b"], selected);
			advanced.rgb_picker.setRGB(rgb[0]);
		}
    if (advanced.cmy_picker != null) {
      let cmy = getUnifiedChannels(["c","m","y"], selected);
      if (cmy && cmy.length > 0) {
        advanced.cmy_picker.setRGB(CMYToRGB(cmy[0]));
      } else {
        log("Trying to get unified cmy channels failed, cmy:", cmy);
      }
    }
    advanced.sliders.forEach((s) => {
      let v = getUnifiedChannels([s.channel], selected);
      s.setValue(v[0]);
      s.redraw();
    });
	};

  advanced.updateView = () => {updateView(fixtures);};

	advanced.ui_elements = [];
  fixtures.forEach((f) => {
    let ui = createFixtureUI(f, advanced.updateView, (fixture) => {
      let selected = !fixture.selected;
      advanced.ui_elements.forEach((ui) => {
        if (ui?.fixture?.model === fixture.model) {
            ui.setSelected(selected);
        }
      });
      advanced.updateView();
    });
    fixture_select_container.appendChild(ui);
    if (previously_selected && previously_selected.length > 0) {
      previously_selected.forEach((fs, i) => {
        if (fs.isSameFixture(f)) {
          ui.setSelected(true);
        }
      }); 
    }
    advanced.ui_elements.push(ui);
  });
  advanced.updateView();
}

export {constructAdvancedView, getUnifiedChannels};
