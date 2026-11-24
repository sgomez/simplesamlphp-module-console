(function () {
  'use strict';

  function lineNumber(n) {
    var line = document.createElement('div');
    line.className = 'ed-ln';
    line.id = 'line-' + n;
    var mark = document.createElement('span');
    var number = document.createElement('span');
    number.textContent = String(n);
    line.append(mark, number);
    return line;
  }

  function syncGutter(editor, gutter, background) {
    var wanted = editor.value.split('\n').length;
    while (gutter.children.length < wanted) {
      gutter.appendChild(lineNumber(gutter.children.length + 1));
      if (background) {
        background.appendChild(document.createElement('div'));
      }
    }
    while (gutter.children.length > wanted) {
      gutter.removeChild(gutter.lastChild);
      if (background && background.lastChild) {
        background.removeChild(background.lastChild);
      }
    }
    editor.rows = Math.max(wanted, 12);
  }

  function confirmDialog(text) {
    var dialog = document.createElement('dialog');
    dialog.className = 'confirm';
    var message = document.createElement('p');
    message.textContent = text;
    var actions = document.createElement('form');
    actions.method = 'dialog';
    var cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.value = 'cancel';
    cancel.textContent = 'Cancel';
    var ok = document.createElement('button');
    ok.className = 'btn btn-danger-solid';
    ok.value = 'ok';
    ok.textContent = 'Confirm';
    actions.append(cancel, ok);
    dialog.append(message, actions);
    document.body.appendChild(dialog);
    dialog.addEventListener('close', function () {
      var confirmed = dialog.returnValue === 'ok';
      dialog.remove();
      if (dialog.onanswer) {
        dialog.onanswer(confirmed);
      }
    });
    dialog.showModal();
    return dialog;
  }

  document.addEventListener('click', function (event) {
    var confirming = event.target.closest('[data-confirm]');
    if (confirming && !confirming.hasAttribute('data-confirmed')) {
      event.preventDefault();
      var form = confirming.form;
      confirmDialog(confirming.getAttribute('data-confirm')).onanswer = function (yes) {
        if (yes && form) {
          confirming.setAttribute('data-confirmed', '');
          form.requestSubmit(confirming);
        }
      };
      return;
    }
    if (document.body.classList.contains('sidebar-open') && !event.target.closest('.shell-side, [data-sidebar-toggle]')) {
      document.body.classList.remove('sidebar-open');
    }
    var toggle = event.target.closest('[data-sidebar-toggle]');
    if (toggle) {
      document.body.classList.toggle('sidebar-open');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      document.body.classList.remove('sidebar-open');
    }
  });

  document.querySelectorAll('[data-editor]').forEach(function (editor) {
    var gutter = document.querySelector('[data-gutter]');
    if (!gutter) {
      return;
    }
    var background = document.querySelector('.ed-bg');
    editor.addEventListener('input', function () {
      syncGutter(editor, gutter, background);
    });
    syncGutter(editor, gutter, background);
  });
})();
