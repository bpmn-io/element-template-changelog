import { expect } from 'chai';

import Diagram from 'diagram-js';

import TranslateModule from 'diagram-js/lib/i18n/translate/index.js';

import ElementTemplateChangelogModule from '../../lib/index.js';


describe('ElementTemplateChangelog', function() {

  const oldTemplate = { id: 'legacy', name: 'Legacy REST', version: 1 };
  const newTemplate = { id: 'rest', name: 'REST', version: 3 };

  const changes = [
    { type: 'update', template: { id: 'legacy', name: 'Legacy REST', version: 2 }, version: 2, text: '- Payload is now called request body.' },
    { type: 'migration', template: newTemplate, text: 'See [docs](https://example.com/docs). <b>Not bold</b> javascript:alert(1)' }
  ];

  const element = { id: 'Task_1' };

  let diagram, applied;

  function createDiagram() {
    applied = [];

    diagram = new Diagram({
      modules: [
        TranslateModule,
        ElementTemplateChangelogModule,
        {
          elementTemplates: [ 'value', {
            applyTemplate: (element, template) => applied.push({ element, template })
          } ]
        }
      ]
    });
  }

  function reviewChanges() {
    diagram.get('eventBus').fire('elementTemplates.reviewChanges', {
      element,
      oldTemplate,
      newTemplate,
      changes
    });
  }

  function getChangelog() {
    return document.querySelector('.element-template-changelog');
  }

  function click(text) {
    const button = Array.from(getChangelog().querySelectorAll('button')).find(button => button.textContent.trim() === text);

    button.click();
  }

  afterEach(function() {
    getChangelog()?.parentNode.remove();

    diagram?.destroy();
  });


  describe('rendering', function() {

    beforeEach(function() {
      createDiagram();

      reviewChanges();
    });


    it('should show title and changes per step', function() {

      // then
      const changelog = getChangelog();

      expect(changelog.querySelector('h3').textContent).to.eql('Migrate from Legacy REST to REST');

      expect(Array.from(changelog.querySelectorAll('h4')).map(h4 => h4.textContent)).to.eql([
        'Legacy REST v2',
        'Legacy REST → REST'
      ]);
    });


    it('should show text as raw text', function() {

      // then
      const text = getChangelog().querySelectorAll('.change pre')[1];

      expect(text.textContent).to.eql(changes[1].text);
      expect(text.querySelector('b')).not.to.exist;
    });


    it('should link http(s) URLs only', function() {

      // then
      const links = getChangelog().querySelectorAll('.changes a');

      expect(links).to.have.length(1);
      expect(links[0].getAttribute('href')).to.eql('https://example.com/docs');
      expect(links[0].rel).to.eql('noopener noreferrer');
    });


    it('should focus confirm', function() {

      // then
      expect(document.activeElement.textContent.trim()).to.eql('Migrate');
    });

  });


  describe('behavior', function() {

    beforeEach(function() {
      createDiagram();

      reviewChanges();
    });


    it('should apply on confirm', async function() {

      // when
      click('Migrate');

      await Promise.resolve();

      // then
      expect(getChangelog()).not.to.exist;
      expect(applied).to.eql([ { element, template: newTemplate } ]);
    });


    it('should close on cancel', async function() {

      // when
      click('Cancel');

      await Promise.resolve();

      // then
      expect(getChangelog()).not.to.exist;
      expect(applied).to.be.empty;
    });


    it('should close on <Escape>', async function() {

      // when
      getChangelog().dispatchEvent(new Event('cancel'));

      await Promise.resolve();

      // then
      expect(getChangelog()).not.to.exist;
      expect(applied).to.be.empty;
    });


    it('should close on backdrop click', async function() {

      // when
      getChangelog().click();

      await Promise.resolve();

      // then
      expect(getChangelog()).not.to.exist;
      expect(applied).to.be.empty;
    });

  });


  it('should close on diagram destroy', async function() {

    // given
    createDiagram();

    reviewChanges();

    // when
    diagram.destroy();

    await Promise.resolve();

    // then
    expect(getChangelog()).not.to.exist;
    expect(applied).to.be.empty;
  });


  it('should title update', function() {

    // given
    createDiagram();

    // when
    diagram.get('eventBus').fire('elementTemplates.reviewChanges', {
      element,
      oldTemplate,
      newTemplate: { ...oldTemplate, version: 3 },
      changes: []
    });

    // then
    expect(getChangelog().querySelector('h3').textContent).to.eql('Update Legacy REST to version 3');
    expect(document.activeElement.textContent.trim()).to.eql('Update');
  });

});
