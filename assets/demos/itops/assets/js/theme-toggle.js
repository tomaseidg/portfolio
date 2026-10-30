/**
 * Light/dark theme toggle. Pairs with includes/theme_head.php, which sets
 * the initial data-theme attribute before first paint. This file only
 * needs to handle the user clicking the toggle button afterwards.
 */
function appToggleTheme() {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('itops_theme', next); } catch (e) {}
}
