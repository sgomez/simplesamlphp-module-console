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

  document.addEventListener('click', function (event) {
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
