import './style.css';
import { createViewer } from './core/viewer.js';
import { createComputer } from './models/computer.js';
import { createComputerMaterials } from './core/lighting.js';

const canvas = document.querySelector('#object');
const viewer = createViewer(canvas, {
  stroke: 1.25,
  createModel(look) {
    const materials = createComputerMaterials(look, 'butter');
    return createComputer(look, materials);
  },
});
viewer.freeze();
window.__isom3trics = viewer;
