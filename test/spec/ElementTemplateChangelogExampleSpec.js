import Modeler from 'bpmn-js/lib/Modeler.js';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule
} from 'bpmn-js-properties-panel';

import { CloudElementTemplatesPropertiesProviderModule } from 'bpmn-js-element-templates';

import ZeebeBehaviorsModule from 'camunda-bpmn-js-behaviors/lib/camunda-cloud/index.js';
import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';

import ElementTemplateChangelogModule from '../../lib/index.js';

import diagramCSS from 'bpmn-js/dist/assets/diagram-js.css';
import bpmnCSS from 'bpmn-js/dist/assets/bpmn-js.css';
import bpmnFontCSS from 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import propertiesPanelCSS from '@bpmn-io/properties-panel/dist/assets/properties-panel.css';
import elementTemplatesCSS from 'bpmn-js-element-templates/dist/assets/element-templates.css';
import changelogCSS from '../../assets/element-template-changelog.css';

import diagramXML from '../fixtures/diagram.bpmn';
import templates from '../fixtures/templates.json';

const singleStart = window.__env__ && window.__env__.SINGLE_START;

const playgroundCSS = `
  html, body { margin: 0; height: 100%; }

  .playground { display: flex; height: 100vh; }
  .playground .canvas { flex: 1; }
  .playground .panel { width: 400px; border-left: solid 1px #ccc; overflow: auto; }
`;


/**
 * Run with `npm start`.
 */
(singleStart ? describe.only : describe.skip)('playground', function() {

  this.timeout(0);

  it('should review changes', async function() {

    // given
    insertCSS(diagramCSS, bpmnCSS, bpmnFontCSS, propertiesPanelCSS, elementTemplatesCSS, changelogCSS, playgroundCSS);

    const container = document.createElement('div');

    container.className = 'playground';
    container.innerHTML = '<div class="canvas"></div><div class="panel"></div>';

    document.body.appendChild(container);

    const modeler = new Modeler({
      container: container.querySelector('.canvas'),
      propertiesPanel: {
        parent: container.querySelector('.panel')
      },
      additionalModules: [
        ZeebeBehaviorsModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ZeebePropertiesProviderModule,
        CloudElementTemplatesPropertiesProviderModule,
        ElementTemplateChangelogModule
      ],
      moddleExtensions: {
        zeebe: ZeebeModdle
      },
      elementTemplates: templates
    });

    // when
    await modeler.importXML(diagramXML);
  });

});


function insertCSS(...sources) {
  for (const source of sources) {
    const style = document.createElement('style');

    style.textContent = source;

    document.head.appendChild(style);
  }
}
