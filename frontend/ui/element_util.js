
function floatLineDisplay(label) {
  let line = newElement("", ["float-line-display"]);
  let container = withLabel(line, label);
  container.line = line;

  container.text = newElement("", []);
  container.appendChild(container.text);

  container.updatePosition = (f) => {
    container.value = f;
    let v = Math.max(-1, Math.min(1, f));
    const percent = ((v+1)/2)*100;
    container.line.style.setProperty("--dot-pos", percent + "%");
    container.text.innerHTML = f.toFixed(4);
  };
  container.setColor = (color) => {
    container.line.style.setProperty("--dot-clr", color);
  };
  return container;
} 

function withLabel(c, label) {
	let container = document.createElement("div");
	container.classList.add("with-label");
	container.classList.add("grid");
	let le = document.createElement("div");
  container.setLabel = (label) => {
    le.innerHTML = label;
  }; 
	container.setLabel(label);
	le.classList.add("with-label-label");
	container.appendChild(le);
	container.appendChild(c);
	return container;
}

function addClasses(e, classes) {
	if (typeof(classes) == "string") {
		e.classList.add(classes);
	} else {
    classes.forEach((c) => e.classList.add(c));
	}
}

function newElement(html, classes) {
	let e = document.createElement("div");
	e.innerHTML = html;
  classes.forEach((c) => e.classList.add(c));
	return e;
}

function createChild(p, classes) {
	let child = document.createElement("div");
	addClasses(child, classes);
	p.appendChild(child);
	return child;
}

function createLabel(text, classes=[]) {
 	let container = document.createElement("div");
	container.classList.add("labeled");
	addClasses(container, classes);

	let label = document.createElement("div");
	label.classList.add("label");
	label.innerHTML = text;

	container.appendChild(label);
  container.label = label;
  container.setActive = (active) => {
    if (active) {
      
      container.label.classList.add("active");
    } else {
      container.label.classList.remove("active");
    }
    container.active = active;
  };
  container.active = false;
	return container;
}

function createTabbedContainer(tabs, callback) {
	let container = document.createElement("div");
	container.classList.add("tabbed")
	let button_container = document.createElement("div");
	button_container.classList.add("tab-buttons");
	container.appendChild(button_container);
	
	container.buttons = {};
	container.tabs = {};

	let on_click = (tab_name) => {
    Object.entries(container.tabs).forEach(([tab, tab_container]) => {
      if (tab === tab_name) {
        container.buttons[tab].classList.add("active");
        tab_container.classList.remove("hidden");
      } else {
        container.buttons[tab].classList.remove("active");
        tab_container.classList.add("hidden");
      }
    });
		callback(tab_name);
	}
  container.removeTab = (tab_name) => {
    const isActive = Object.keys(container.buttons[tab_name].classList).includes("active");
    container.removeChild(container.tabs[tab_name]);
    delete container.tabs[tab_name];
    button_container.removeChild(container.buttons[tab_name]);
    delete container.buttons[tab_name];
    if (Object.keys(container.buttons).length > 0) {
      on_click(Object.keys(container.buttons)[0]);
    }
  };
  container.addTab = (tab_name, bypass_click=false) => {
    if (Object.keys(container.tabs).includes(tab_name)) {
      container.removeTab(tab_name);
    }
    let tab_container = document.createElement("div");
    tab_container.classList.add("hidden");
    container.tabs[tab_name] = tab_container;
    container.appendChild(tab_container);
    let button = document.createElement("div");
    button.innerHTML = tab_name;
    button.classList.add("tab-button");
    button.addEventListener("click", (e) => {on_click(tab_name);});
    button.addEventListener("touch", (e) => {on_click(tab_name);});
    button_container.appendChild(button);
    container.buttons[tab_name] = button;
    if (!bypass_click && Object.keys(container.tabs).length === 1) {
      on_click(tab_name);
    }
    return tab_container;
  };

  tabs.forEach((tab) => container.addTab(tab, true));

	on_click(tabs[0]);
	return container;	
}

export {withLabel, addClasses, newElement, createChild, createLabel, createTabbedContainer, floatLineDisplay};
