(function () {
  'use strict';

  function syncGutter(editor, gutter) {
    var wanted = editor.value.split('\n').length;
    while (gutter.children.length < wanted) {
      gutter.appendChild(document.createElement('li'));
    }
    while (gutter.children.length > wanted) {
      gutter.removeChild(gutter.lastChild);
    }
    gutter.scrollTop = editor.scrollTop;
  }

  function confirmDialog(text) {
    var dialog = document.createElement('dialog');
    dialog.className = 'confirm';
    var message = document.createElement('p');
    message.textContent = text;
    var actions = document.createElement('form');
    actions.method = 'dialog';
    var cancel = document.createElement('button');
    cancel.className = 'button';
    cancel.value = 'cancel';
    cancel.textContent = 'Cancel';
    var ok = document.createElement('button');
    ok.className = 'button danger';
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
    if (document.body.classList.contains('sidebar-open') && !event.target.closest('.sidebar, [data-sidebar-toggle]')) {
      document.body.classList.remove('sidebar-open');
    }
    var toggle = event.target.closest('[data-sidebar-toggle]');
    if (toggle) {
      document.body.classList.toggle('sidebar-open');
    }
    var dismiss = event.target.closest('[data-dismiss]');
    var notice = dismiss ? dismiss.closest('[data-notice]') : null;
    if (notice) {
      notice.classList.add('hidden');
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
    editor.addEventListener('input', function () {
      syncGutter(editor, gutter);
    });
    editor.addEventListener('scroll', function () {
      gutter.scrollTop = editor.scrollTop;
    });
    syncGutter(editor, gutter);
  });
})();
