import {createLogger} from './util';
const {isLogging, log} = createLogger("ui");

let menu = {};

function refreshUI() {
  Object.entries(menu).forEach(([k,body]) => body.redraw());
}


function turnOffTabs() {
  Object.entries(menu).forEach(([name, tab], i) => {
    tab.body.classList.add('hidden');
    tab.button.classList.remove('active');
  });
}

function turnOnTab(tab) {
  tab.button.classList.add('active');
  tab.body.classList.remove('hidden');
  tab.ui_elements.forEach((ui) => ui.redraw());
  if (tab.hasOwnProperty("redraw")) {
    tab.redraw();
  }
}

function loadMenu() {
  let tabs = document.querySelectorAll('#main-menu .menubar-tab');
  let bodies = Array.from(document.querySelectorAll('.page-body'));
  menu = {};
  tabs.forEach((tab) => {
    const name = tab.getAttribute('id');
    let body = bodies.find((e) => e.getAttribute('id') === `${name}-body`);

    menu[name] = {
      button: tab,
      body: body,
      ui_elements: [],
    };
    menu[name].redraw = () => {
      menu[name].ui_elements.forEach((e) => {
        e.redraw();
      });
    };
    menu[name].button.addEventListener('click', ()=>{
      turnOffTabs();
      turnOnTab(menu[name]);
    });
  });
}

function getMenu(title) {
  if (!menu.hasOwnProperty(title)) {
    log("Tried to get menu with title: '" + title + "' menu:", menu);
    return; 
  }
  return menu[title];
}
export {refreshUI, getMenu, loadMenu};
