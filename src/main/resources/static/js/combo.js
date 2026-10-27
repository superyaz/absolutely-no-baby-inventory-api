function initializePremiumProductSelects() {
    const productModal = document.querySelector(
        '.modal-content[data-modal-content="new-product"]'
    );

    if (!productModal) return;

    const selects = productModal.querySelectorAll(
        'select.select'
    );

    selects.forEach((select, index) => {

        if (select.dataset.premiumInitialized === 'true') return;

        select.dataset.premiumInitialized = 'true';
        select.classList.add('premium-select__native');

        const wrapper = document.createElement('div');
        wrapper.className = 'premium-select';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'premium-select__trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const value = document.createElement('span');
        value.className = 'premium-select__value';

        const arrow = document.createElement('i');
        arrow.className = 'fa-solid fa-chevron-down premium-select__arrow';
        arrow.setAttribute('aria-hidden', 'true');

        trigger.append(value, arrow);

        const menu = document.createElement('div');
        menu.className = 'premium-select__menu';

        const searchWrap = document.createElement('div');
        searchWrap.className = 'premium-select__search-wrap';

        const searchIcon = document.createElement('i');
        searchIcon.className =
            'fa-solid fa-magnifying-glass premium-select__search-icon';
        searchIcon.setAttribute('aria-hidden', 'true');

        const search = document.createElement('input');
        search.type = 'search';
        search.className = 'premium-select__search';
        search.placeholder = 'Buscar opción...';
        search.autocomplete = 'off';
        search.setAttribute('aria-label', 'Buscar opción');

        searchWrap.append(searchIcon, search);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'premium-select__options';
        optionsContainer.setAttribute('role', 'listbox');

        const empty = document.createElement('div');
        empty.className = 'premium-select__empty';
        empty.textContent = 'No se encontraron opciones.';
        empty.hidden = true;

        optionsContainer.appendChild(empty);
        menu.append(searchWrap, optionsContainer);


        select.parentNode.insertBefore(wrapper, select);
        wrapper.append(trigger, menu, select);

        function updateSelectedValue() {
            const selectedOption = select.options[select.selectedIndex];
            const hasValue = selectedOption && selectedOption.value !== '';

            value.textContent = hasValue
                ? selectedOption.textContent.trim()
                : (selectedOption?.textContent.trim() || 'Seleccione una opción');

            value.classList.toggle('is-placeholder', !hasValue);

            trigger.setAttribute(
                'aria-label',
                `${select.getAttribute('aria-label') || select.id}: ${value.textContent}`
            );
        }

        function renderOptions() {
            optionsContainer.querySelectorAll(
                '.premium-select__option'
            ).forEach(option => option.remove());

            const query = search.value.trim().toLocaleLowerCase('es');
            let visibleOptions = 0;

            Array.from(select.options).forEach((nativeOption, optionIndex) => {
                const text = nativeOption.textContent.trim();


                if (nativeOption.value === '') return;

                if (!text.toLocaleLowerCase('es').includes(query)) return;

                const optionButton = document.createElement('button');
                optionButton.type = 'button';
                optionButton.className = 'premium-select__option';
                optionButton.setAttribute('role', 'option');
                optionButton.setAttribute(
                    'aria-selected',
                    String(nativeOption.selected)
                );

                const check = document.createElement('span');
                check.className = 'premium-select__option-check';
                check.innerHTML = nativeOption.selected
                    ? '<i class="fa-solid fa-check" aria-hidden="true"></i>'
                    : '';

                const label = document.createElement('span');
                label.textContent = text;

                optionButton.append(check, label);

                if (nativeOption.selected) {
                    optionButton.classList.add('is-selected');
                }

                optionButton.addEventListener('click', () => {
                    select.selectedIndex = optionIndex;
                    select.dispatchEvent(new Event('change', { bubbles: true }));

                    updateSelectedValue();
                    closeMenu();
                    renderOptions();
                });

                optionsContainer.insertBefore(optionButton, empty);
                visibleOptions++;
            });

            empty.hidden = visibleOptions > 0;
        }

        function openMenu() {

            productModal.querySelectorAll('.premium-select.is-open').forEach(other => {
                if (other !== wrapper) {
                    other.classList.remove('is-open');
                    other.querySelector('.premium-select__trigger')
                        ?.setAttribute('aria-expanded', 'false');
                }
            });

            wrapper.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            search.value = '';
            renderOptions();

            window.requestAnimationFrame(() => search.focus());
        }

        function closeMenu() {
            wrapper.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', () => {
            if (wrapper.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        search.addEventListener('input', renderOptions);

        search.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeMenu();
                trigger.focus();
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                const firstOption = optionsContainer.querySelector(
                    '.premium-select__option'
                );
                firstOption?.click();
            }
        });

        select.addEventListener('change', () => {
            updateSelectedValue();
            renderOptions();
        });

        updateSelectedValue();
        renderOptions();
    });


    if (!document.documentElement.dataset.premiumSelectListener) {
        document.documentElement.dataset.premiumSelectListener = 'true';

        document.addEventListener('click', event => {
            if (event.target.closest('.premium-select')) return;

            document.querySelectorAll('.premium-select.is-open').forEach(wrapper => {
                wrapper.classList.remove('is-open');
                wrapper.querySelector('.premium-select__trigger')
                    ?.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;

            document.querySelectorAll('.premium-select.is-open').forEach(wrapper => {
                wrapper.classList.remove('is-open');
                wrapper.querySelector('.premium-select__trigger')
                    ?.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

initializePremiumProductSelects();
