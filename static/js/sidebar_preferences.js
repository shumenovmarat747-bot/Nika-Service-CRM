(function () {
    'use strict';

    var DEFAULT_HIDDEN = ['warehouse', 'shop', 'reports', 'salary'];
    var STORAGE_PREFIX = 'shumenov.sidebar.v1.';

    function storageKey() {
        var userId = window.currentUserId != null ? String(window.currentUserId) : 'guest';
        return STORAGE_PREFIX + userId;
    }

    function readHiddenSections() {
        try {
            var saved = window.localStorage.getItem(storageKey());
            if (saved === null) return DEFAULT_HIDDEN.slice();
            var parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed.filter(function (value) {
                return typeof value === 'string';
            }) : DEFAULT_HIDDEN.slice();
        } catch (error) {
            return DEFAULT_HIDDEN.slice();
        }
    }

    function saveHiddenSections(hiddenSections) {
        try {
            window.localStorage.setItem(storageKey(), JSON.stringify(hiddenSections));
        } catch (error) {
            /* В приватном режиме localStorage может быть недоступен — панель всё равно работает. */
        }
    }

    function availableSections() {
        return Array.prototype.slice.call(
            document.querySelectorAll('[data-sidebar-section][data-sidebar-surface="desktop"]')
        ).map(function (item) {
            return {
                id: item.dataset.sidebarSection,
                label: item.dataset.sidebarLabel || item.dataset.sidebarSection,
                icon: item.dataset.sidebarIcon || 'fa-circle'
            };
        });
    }

    function applyVisibility(hiddenSections) {
        document.querySelectorAll('[data-sidebar-section]').forEach(function (item) {
            var hidden = hiddenSections.indexOf(item.dataset.sidebarSection) !== -1;
            item.classList.toggle('sidebar-section-hidden', hidden);
            item.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        });
    }

    function announce(message) {
        var status = document.getElementById('sidebarCustomizerStatus');
        if (status) status.textContent = message;
    }

    function createSwitch(section, hiddenSections) {
        var row = document.createElement('label');
        row.className = 'sidebar-customizer-option';

        var icon = document.createElement('span');
        icon.className = 'sidebar-customizer-icon';
        icon.setAttribute('aria-hidden', 'true');
        var iconGlyph = document.createElement('i');
        iconGlyph.className = 'fas ' + section.icon;
        icon.appendChild(iconGlyph);

        var copy = document.createElement('span');
        copy.className = 'sidebar-customizer-option-copy';
        var title = document.createElement('strong');
        title.textContent = section.label;
        var caption = document.createElement('small');
        caption.textContent = 'Показывать в меню';
        copy.appendChild(title);
        copy.appendChild(caption);

        var control = document.createElement('span');
        control.className = 'form-check form-switch m-0';
        var input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.role = 'switch';
        input.checked = hiddenSections.indexOf(section.id) === -1;
        input.dataset.sidebarToggle = section.id;
        input.setAttribute('aria-label', 'Показывать раздел «' + section.label + '»');
        control.appendChild(input);

        row.appendChild(icon);
        row.appendChild(copy);
        row.appendChild(control);
        return row;
    }

    function renderCustomizer(hiddenSections) {
        var list = document.getElementById('sidebarCustomizerList');
        if (!list) return;
        list.replaceChildren();
        availableSections().forEach(function (section) {
            list.appendChild(createSwitch(section, hiddenSections));
        });
    }

    function init() {
        var hiddenSections = readHiddenSections();
        applyVisibility(hiddenSections);
        renderCustomizer(hiddenSections);

        document.addEventListener('change', function (event) {
            var input = event.target.closest('[data-sidebar-toggle]');
            if (!input) return;
            var sectionId = input.dataset.sidebarToggle;
            hiddenSections = hiddenSections.filter(function (id) { return id !== sectionId; });
            if (!input.checked) hiddenSections.push(sectionId);
            saveHiddenSections(hiddenSections);
            applyVisibility(hiddenSections);
            announce(input.checked ? 'Раздел добавлен в панель' : 'Раздел скрыт из панели');
        });

        var reset = document.getElementById('sidebarCustomizerReset');
        if (reset) {
            reset.addEventListener('click', function () {
                hiddenSections = [];
                saveHiddenSections(hiddenSections);
                applyVisibility(hiddenSections);
                renderCustomizer(hiddenSections);
                announce('Все доступные разделы показаны');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
