/* Threshold-Miku Light - Friends JS */

(function() {
    'use strict';

    const GROUP_HEADER_BG  = 'rgba(57, 197, 187, 0.18)';
    const GROUP_HEADER_COLOR = '#1a3a4a';

    function patchFriendsList() {
        // Group headers: Online Friends / Offline / In-Game / game groups
        document.querySelectorAll('.groupHeaderContainer').forEach(function(el) {
            el.style.setProperty('background', GROUP_HEADER_BG, 'important');
            el.style.setProperty('border-radius', '6px', 'important');
        });
        // Group name text color
        document.querySelectorAll('.groupName').forEach(function(el) {
            el.style.setProperty('color', GROUP_HEADER_COLOR, 'important');
        });
    }

    const observer = new MutationObserver(function() {
        patchFriendsList();
    });

    function init() {
        patchFriendsList();
        const root = document.querySelector('.friendlistListContainer') || document.body;
        observer.observe(root, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
