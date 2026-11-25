(function () {
  'use strict';

  document.addEventListener('click', function (event) {
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
})();
