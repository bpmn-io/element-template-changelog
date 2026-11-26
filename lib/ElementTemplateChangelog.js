import {
  html,
  render,
  useLayoutEffect,
  useRef
} from 'diagram-js/lib/ui/index.js';

/**
 * @typedef { {
 *   type: 'update' | 'migration',
 *   template: Object,
 *   version?: number,
 *   text: string
 * } } Change
 *
 * @typedef { {
 *   oldTemplate: Object,
 *   newTemplate: Object,
 *   changes: Change[]
 * } } ChangelogContext
 */

/**
 * Shows the changes of an element template update or migration, as requested
 * via `elementTemplates.reviewChanges`, and applies the new template once
 * confirmed.
 *
 * @param {EventBus} eventBus
 * @param {ElementTemplates} elementTemplates
 * @param {Function} translate
 */
export default function ElementTemplateChangelog(eventBus, elementTemplates, translate) {
  this._translate = translate;
  this._cancels = new Set();

  eventBus.on('diagram.destroy', () => {
    this._cancels.forEach(cancel => cancel());
  });

  eventBus.on('elementTemplates.reviewChanges', event => {
    const {
      element,
      newTemplate
    } = event;

    this.open(event).then(() => {
      elementTemplates.applyTemplate(element, newTemplate);
    }).catch(error => {
      if (error !== 'user-canceled') {
        console.error('elementTemplates.reviewChanges :: error', error);
      }
    });
  });
}

ElementTemplateChangelog.$inject = [
  'eventBus',
  'elementTemplates',
  'translate'
];

/**
 * Open the changelog for the given change of templates.
 *
 * @param {ChangelogContext} context
 *
 * @return {Promise<void>} resolved once confirmed, rejected with `user-canceled` otherwise
 */
ElementTemplateChangelog.prototype.open = function(context) {
  const translate = this._translate;

  return new Promise((resolve, reject) => {
    const container = document.createElement('div');

    const close = () => {
      this._cancels.delete(onCancel);

      render(null, container);
      container.remove();
    };

    const onConfirm = () => {
      close();
      resolve();
    };

    const onCancel = () => {
      close();
      reject('user-canceled');
    };

    this._cancels.add(onCancel);

    document.body.appendChild(container);

    render(html`
      <${ Changelog }
        ...${ context }
        translate=${ translate }
        onConfirm=${ onConfirm }
        onCancel=${ onCancel } />
    `, container);
  });
};

function Changelog({ oldTemplate, newTemplate, changes, translate, onConfirm, onCancel }) {
  const isUpdate = oldTemplate.id === newTemplate.id;

  const title = isUpdate
    ? translate('Update {name} to version {version}', { name: newTemplate.name, version: newTemplate.version })
    : translate('Migrate from {from} to {to}', { from: oldTemplate.name, to: newTemplate.name });

  const dialogRef = useRef();

  // a modal dialog traps focus, and restores it once closed
  useLayoutEffect(() => {
    const dialog = dialogRef.current;

    dialog.showModal();

    return () => dialog.close();
  }, []);

  const onBackdropClick = event => event.target === event.currentTarget && onCancel();

  return html`
    <dialog
      ref=${ dialogRef }
      class="element-template-changelog bio-theme-parent"
      aria-labelledby="element-template-changelog-title"
      onCancel=${ onCancel }
      onClick=${ onBackdropClick }>
      <h3 id="element-template-changelog-title">${ title }</h3>
      <div class="changes">
        ${ changes.map(change => html`
          <section class="change">
            <h4>${ getChangeTitle(change, oldTemplate, translate) }</h4>
            <pre>${ renderText(change.text) }</pre>
          </section>
        `) }
      </div>
      <div class="actions">
        <button onClick=${ onCancel }>${ translate('Cancel') }</button>
        <button autofocus onClick=${ onConfirm }>
          ${ isUpdate ? translate('Update') : translate('Migrate') }
        </button>
      </div>
    </dialog>
  `;
}

/**
 * Title a change by the step that contributes it.
 */
function getChangeTitle(change, oldTemplate, translate) {
  const {
    type,
    template,
    version
  } = change;

  if (type === 'migration') {
    return translate('{from} → {to}', { from: oldTemplate.name, to: template.name });
  }

  return translate('{name} v{version}', { name: template.name, version });
}

/**
 * Render untrusted Markdown as raw text, with clickable http(s) links.
 */
function renderText(text) {
  const parts = [];

  let index = 0;

  for (const match of text.matchAll(/https?:\/\/[^\s()<>"']+/g)) {
    parts.push(
      text.slice(index, match.index),
      html`<a href=${ match[0] } target="_blank" rel="noopener noreferrer">${ match[0] }</a>`
    );

    index = match.index + match[0].length;
  }

  parts.push(text.slice(index));

  return parts;
}
