(function(){
  var KEY = 'lc-anim-delays';
  var delays;
  try {
    var raw = sessionStorage.getItem(KEY);
    if (raw) { delays = JSON.parse(raw); }
  } catch(e) {}
  if (!delays) {
    delays = {
      bg: -(Math.random() * 60).toFixed(2) + 's',
      aurora: -(Math.random() * 90).toFixed(2) + 's',
      particles: -(Math.random() * 120).toFixed(2) + 's'
    };
    try { sessionStorage.setItem(KEY, JSON.stringify(delays)); } catch(e) {}
  }
  document.body.style.setProperty('--bg-shift-delay', delays.bg);
  var s = document.querySelector('.s');
  if (s) {
    s.style.setProperty('--aurora-delay', delays.aurora);
    s.style.setProperty('--particles-delay', delays.particles);
  }
})();
