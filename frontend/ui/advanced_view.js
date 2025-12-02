import {withLabel, newElement} from './elementUtil';
import {createFixtureUI} from './fixtures';
import {Slider} from './slider';
import {ColorPicker} from './colorPicker';
import {stage} from './updater';
import {refreshUI, getMenu} from './ui';
import {updateMultiverse} from './universe';

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

function getSubverses(fs) {
	let subverses = [];
  fs.forEach((f) => subverses.push(f.subverse()));
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
  advanced.selected_fixtures.forEach((f) => f.updateChannels(vs));
  updateMultiverse(advanced.selected_fixtures.map((f) => f.subverse()));
  stage(advanced.selected_fixtures);
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
		let subverses = getSubverses(selectedFixtures());
		if (subverses.length < 1) {
			return;
		}
    console.log("Created scene, subverses:", subverses);
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
	advanced.ui_elements = [];

  let toggles = {
    color: {active: false, element: document.getElementById("t-cf-color")},
    strobe_dimmer: {active: false, element: document.getElementById("t-cf-sd")},
    position: {active: false, element: document.getElementById("t-cf-pos")},
    gobo: {active: false, element:document.getElementById("t-cf-gobo")},
    zoom_focus: {active: false, element:document.getElementById("t-cf-zf")},
    fine: {active: false, element:document.getElementById("t-cf-fine")},
  };
  
  Object.entries(toggles).forEach(([_, obj]) => {
    obj.element.addEventListener("click", (e) => {
      obj.element.classList.toggle("toggled");
      obj.active = obj.element.classList.contains("toggled");
      advanced.updateView();
    });
    obj.active = obj.element.classList.contains("toggled");
  });

  const addSlider = (channel, parent) => {
    let s = new Slider(channel, 255, (v) => updateFixtures([{p:channel,v:v}]));
    parent.appendChild(s.container);
    s.channel = channel;
    advanced.sliders.push(s);
  };

  let input_container = document.getElementById("d-input-container");
  input_container.innerHTML = "";

	let {updatedSelection} = constructSelectionMenu();
	constructNewSceneMenu(on_new_scene_cb);	
  
  let fixture_select_container = document.getElementById("d-fixture-select-container");
  fixture_select_container.innerHTML = "";

	advanced.ui_elements = [];
	
  let previously_selected = advanced.selected_fixtures;  
	advanced.selected_fixtures = [];


	advanced.rgb_picker = null;
	advanced.sliders = [];
	
	advanced.redraw = () => {
		if (advanced.rgb_picker != null) {
			let rgb = getUnifiedChannels(["r","g","b"], advanced.selected_fixtures);
			advanced.rgb_picker.setRGB(rgb[0]);
		}
    if (advanced.cmy_picker != null) {
      let cmy = getUnifiedChannels(["c","m","y"], advanced.selected_fixtures);
      advanced.cmy_picker.setCMY(cmy[0]);
    }
    advanced.sliders.forEach((s) => {
      let v = getUnifiedChannels([s.channel], advanced.selected_fixtures);
      s.setValue(v[0]);
      s.redraw();
    });
	};

	advanced.updateView = () => {
		let channels = [];
		advanced.selected_fixtures = [];
    fixtures.forEach((f) => {
      if (f.selected) {
        advanced.selected_fixtures.push(f);
        f.channel_names.forEach((name) => {
          if (!channels.includes(name)) channels.push(name);
        });
      }
    });
    let include = [];
    if (!toggles.fine.active) {
      channels = channels.filter((c) => !c.includes("fine"));
    }
    if (toggles.color.active) {
      include = include.concat(["r","g","b","c","m","y","w", "fine_c","fine_m","fine_y"])
        .concat(channels.filter((c) => c.includes("color")));
    }
    if (toggles.position.active) {
      include = include.concat(["pan", "tilt", "fine_pan", "fine_tilt"]);
    }
    if (toggles.strobe_dimmer.active) {
      include = include.concat(["strobe", "dimmer", "fine_strobe", "fine_dimmer"]);
    }
    if (toggles.zoom_focus.active) {
      include = include.concat(["zoom", "focus", "fine_zoom", "fine_focus"]);
    }
    if (toggles.gobo.active) {
      include = include.concat(channels.filter((c) => c.includes("gobo") || c.includes("prism")));
    }
    
    if (include.length > 0) channels = channels.filter((c) => include.includes(c));


		input_container.innerHTML = "";
		updatedSelection(advanced.selected_fixtures.length);

		advanced.sliders = [];
    let color_column = newElement("", ["grid-a", "flex-column", "gap"]);
    input_container.appendChild(color_column);

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

		  channels = channels.filter((c) => !["r","g","b", "fine_r","fine_g","fnie_b"].includes(c));
		} else {
			advanced.rgb_picker = null;
		}

    if (["c","m","y"].every(v => channels.includes(v))) {
      advanced.cmy_picker = new ColorPicker((cp) => {
        let cmy = cp.cmy;
        updateFixtures([
          {p:"c",v:cmy[0]},
          {p:"m",v:cmy[1]},
          {p:"y",v:cmy[2]},
        ]);
      });
      advanced.cmy_picker.container.classList.add("grid-a");
      advanced.cmy_picker.tabbed_container.openTab("CMY");
      color_column.appendChild(withLabel(advanced.cmy_picker.container, "Channels: C, M, Y", false, true));

      channels = channels.filter((c) => !["c","m","y", "fine_c","fine_m","fine_y"].includes(c));
    } else {
      advanced.cmy_picker = null;
    }

		let sliders_c = newElement("", ["grid-b","flex-column", "gap"]);

    
    channels = channels.filter((c) => {
      if (c.includes("color") || c === 'w') {
        addSlider(c, color_column);
        return false;
      } 
      return true;
    });

    channels.forEach((c) => {
      addSlider(c, sliders_c);
    });

		input_container.appendChild(sliders_c);
    advanced.redraw();
	};

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
    if (previously_selected && previously_selected.length > 0) {
      previously_selected.forEach((fs, i) => {
        if (fs.isSameFixture(f)) {
          ui.setSelected(true);
        }
      }); 
    }
    fixture_select_container.appendChild(ui);
    advanced.ui_elements.push(ui);
  });
  advanced.updateView();
}

export {constructAdvancedView, getUnifiedChannels};
