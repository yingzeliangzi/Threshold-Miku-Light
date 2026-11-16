/* Threshold-Miku Light - Steam JS (main window)

   Store / community pages: reload the first page after the library.

   While the library is shown, Steam parks the main window's web view on a
   blank data: page. The first store or community page loaded after that
   page cannot reach https://steamloopback.host (Steam's CEF sends those
   requests to the real network, where they fail), so the skin's
   css/webkit.css never loads and the page keeps Steam's navy background.
   Every later page in the view loads it fine, so when the view goes from
   the data: page to a store or community page, reload it once. */

(() => {
    if (window.__mikuWebViewFix) return;
    window.__mikuWebViewFix = true;

    // Same sites as the web patches in skin.json
    const themed = /^https:\/\/(([A-Za-z0-9-]+\.)*steampowered\.com|steamcommunity\.com)(\/|$)/;

    const manager = () => {
        try {
            return window.opener && window.opener.MainWindowBrowserManager;
        } catch (e) {
            return null;
        }
    };

    let lastURL = null;

    const check = () => {
        const m = manager();
        if (!m || !m.m_browser) return;
        // m_URL changes when the new page commits (its title is known, the
        // page is still loading); reloading right then costs the least time
        const url = m.m_URL || '';
        if (url === lastURL) return;
        const previous = lastURL;
        lastURL = url;
        if (previous && previous.startsWith('data:') && themed.test(url)) {
            try {
                m.m_browser.Reload();
            } catch (e) {
                /* web view gone or API changed: leave the page as it is */
            }
        }
    };

    setInterval(check, 250);
})();
