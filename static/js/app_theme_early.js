(function () {
    try {
        var stored = localStorage.getItem('theme') || 'light';
        if (['light', 'dark', 'retro'].indexOf(stored) === -1) {
            stored = 'light';
        }
        var root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark', 'theme-retro');
        root.classList.add('theme-' + stored);
        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            var themeColorMap = {
                dark: '#111118',
                light: '#f5f4f8',
                retro: '#ff1493'
            };
            themeMeta.setAttribute('content', themeColorMap[stored] || '#1c1c24');
        }
    } catch (e) {
        // localStorage may be unavailable
    }
})();
