/**
 * Template Registry
 * Central registration for all available templates
 */

const invoice = require('./invoice');
const receipt = require('./receipt');
const certificate = require('./certificate');
const report = require('./report');
const contract = require('./contract');

const templates = {
  invoice,
  receipt,
  certificate,
  report,
  contract
};

const templateNames = Object.keys(templates);

function getTemplate(name) {
  if (!templates[name]) {
    const available = templateNames.join(', ');
    throw new Error(`Unknown template: "${name}". Available templates: ${available}`);
  }
  return templates[name];
}

function isValidTemplate(name) {
  return templateNames.includes(name);
}

module.exports = {
  templates,
  templateNames,
  getTemplate,
  isValidTemplate
};
