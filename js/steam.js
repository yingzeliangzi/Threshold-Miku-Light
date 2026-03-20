/* Threshold-Miku Light - Steam JS */

(function() {
    'use strict';

    const SELECTED_GAME_BG = 'rgba(57, 197, 187, 0.30)';
    const COLLECTION_HEADER_BG = 'rgba(57, 197, 187, 0.18)';
    const COLLECTION_HEADER_COLOR = '#1a3a4a';

    function patchLibraryList() {
        // Selected game item
        document.querySelectorAll('._2-O4ZG0KrnSrzISHBKctFQ._1VBNpnuk5eWT3VSCWNH57k').forEach(el => {
            el.style.setProperty('background', SELECTED_GAME_BG, 'important');
        });
        // Collection/favorites header rows - black text for readability
        document.querySelectorAll('._2sYIghGVXJr6tsQVvcryy8.ehAsUVkW87U5OHZJohB5N').forEach(el => {
            el.style.setProperty('background', COLLECTION_HEADER_BG, 'important');
            el.style.setProperty('color', '#000000', 'important');
        });
        // Collection/favorites name text - black color
        document.querySelectorAll('._2-O4ZG0KrnSrzISHBKctFQ._2ws8DONH9fxQjPXEmRpujE').forEach(el => {
            el.style.setProperty('color', '#000000', 'important');
        });
        // Remove background from collection name rows (not the header)
        document.querySelectorAll('._2-O4ZG0KrnSrzISHBKctFQ._2ws8DONH9fxQjPXEmRpujE').forEach(el => {
            // Only remove background if this is NOT a header row
            if (!el.classList.contains('ehAsUVkW87U5OHZJohB5N')) {
                el.style.setProperty('background', 'transparent', 'important');
            }
        });
    }

    // Run on DOM changes (ReactVirtualized re-renders rows)
    const observer = new MutationObserver(() => {
        patchLibraryList();
    });

    function init() {
        patchLibraryList();
        const sidebar = document.querySelector('._3x1HklzyDs4TEjACrRO2tB') ||
                        document.querySelector('.ReactVirtualized__Grid') ||
                        document.body;
        if (sidebar) {
            observer.observe(sidebar, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
