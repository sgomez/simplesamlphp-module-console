(function () {
  'use strict';

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-sidebar-toggle]');
    if (toggle) {
      document.body.classList.toggle('sidebar-open');
    }
  });
})();
