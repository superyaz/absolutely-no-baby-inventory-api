'use strict';

const navTabs = document.getElementById('navTabs');
const modalBackdrop = document.getElementById('modalBackdrop');
const modal = document.getElementById('modal');
const storeMenu = document.getElementById('storeMenu');
const userMenu = document.getElementById('userMenu');
let usuarioSesionActual = null;
let usuarioSesionPromise = null;
const MOVEMENT_TYPE_CODES = ['ENT', 'SAL', 'AJU', 'DEV'];
let movementReferenceRequest = 0;
let movementTypesReady = false;
let movementSearchTimer = null;
let movementSearchRequest = 0;
let movementSearchResults = [];
let movementSaving = false;

let movementDraft = {
    codigoTipoMovimiento: 'ENT',
    direccionDevolucion: 'ENTRADA',
    detalles: []
};

let transferContext = null;

let transferDraft = {
    sucursalOrigenId: '',
    detalles: []
};

let transferSearchTimer = null;

let transferSearchRequest = 0;

let transferSearchResults = [];

let transferenciasActuales = [];

let transferSaving = false;

const tallasPorModelo = {
    "01": ["RN", "0M", "0-3M"],
    "02": ["3M", "3-6M", "6M"],
    "03": ["6M", "6-9M", "9M"],
    "04": ["9M", "9-12M", "12M"]
};

function inicializarFiltrosPremium() {
    const ids = [
        'sizeFilter',
        'groupFilter',
        'typeFilter',
        'movementTypeFilter',
        'movementDateFilter',
        'transferStatusFilter',
        'transferOriginStore',
        'countStatusFilter'
    ];

    ids.forEach(id => {
        const select = document.getElementById(id);

        if (!select || select.dataset.premiumReady === 'true') {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'inventory-premium-select';
        wrapper.dataset.selectId = id;

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        select.classList.add('inventory-premium-native');
        select.dataset.premiumReady = 'true';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'inventory-premium-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const value = document.createElement('span');
        value.className = 'inventory-premium-value';

        const arrow = document.createElement('span');
        arrow.className = 'inventory-premium-arrow';
        arrow.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';

        trigger.append(value, arrow);

        const menu = document.createElement('div');
        menu.className = 'inventory-premium-menu';
        menu.setAttribute('role', 'listbox');

        wrapper.append(trigger, menu);

        function actualizarOpciones() {
            const valorActual = select.value;

            value.textContent =
                select.selectedOptions[0]?.textContent || 'Seleccionar';

            menu.replaceChildren();

            Array.from(select.options).forEach(option => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'inventory-premium-option';
                item.setAttribute('role', 'option');
                item.setAttribute(
                    'aria-selected',
                    String(option.value === valorActual)
                );

                const label = document.createElement('span');
                label.textContent = option.textContent;

                const check = document.createElement('span');
                check.className = 'inventory-premium-check';
                check.textContent = '✓';

                item.append(label, check);

                if (option.value === valorActual) {
                    item.classList.add('selected');
                }

                item.addEventListener('click', () => {
                    select.value = option.value;


                    select.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );

                    actualizarOpciones();
                    cerrarMenu();
                });

                menu.appendChild(item);
            });

            if (!select.options.length) {
                const empty = document.createElement('div');
                empty.className = 'inventory-premium-empty';
                empty.textContent = 'No hay opciones disponibles';
                menu.appendChild(empty);
            }
        }

        function abrirMenu() {
            document.querySelectorAll(
                '.inventory-premium-select.open'
            ).forEach(otro => {
                if (otro !== wrapper) {
                    otro.classList.remove('open');
                    otro.querySelector('.inventory-premium-trigger')
                        ?.setAttribute('aria-expanded', 'false');
                }
            });

            actualizarOpciones();
            wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
        }

        function cerrarMenu() {
            wrapper.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', () => {
            wrapper.classList.contains('open')
                ? cerrarMenu()
                : abrirMenu();
        });

        select.addEventListener('change', actualizarOpciones);


        const observer = new MutationObserver(actualizarOpciones);
        observer.observe(select, {
            childList: true,
            subtree: true
        });

        actualizarOpciones();
    });

    if (!document.documentElement.dataset.premiumFiltersReady) {
        document.addEventListener('click', event => {
            if (!event.target.closest('.inventory-premium-select')) {
                document.querySelectorAll(
                    '.inventory-premium-select.open'
                ).forEach(wrapper => {
                    wrapper.classList.remove('open');
                    wrapper.querySelector('.inventory-premium-trigger')
                        ?.setAttribute('aria-expanded', 'false');
                });
            }
        });

        document.documentElement.dataset.premiumFiltersReady = 'true';
    }
}

function inicializarDireccionDevolucionPremium() {

    const select = document.getElementById(
        'movementReturnDirectionSelect'
    );

    if (!select || select.dataset.premiumReady === 'true') {
        return;
    }

    select.dataset.premiumReady = 'true';


    select.classList.add('inventory-premium-native');

    const wrapper = document.createElement('div');

    wrapper.className =
        'inventory-premium-select movement-return-premium-select';

    select.parentNode.insertBefore(wrapper, select);

    const trigger = document.createElement('button');

    trigger.type = 'button';
    trigger.className = 'inventory-premium-trigger';

    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const value = document.createElement('span');

    value.className = 'inventory-premium-value';

    const arrow = document.createElement('span');

    arrow.className = 'inventory-premium-arrow';

    arrow.innerHTML = `
        <i class="fa-solid fa-chevron-down"></i>
    `;

    trigger.append(value, arrow);

    const menu = document.createElement('div');

    menu.className = 'inventory-premium-menu';

    menu.setAttribute('role', 'listbox');

    wrapper.append(trigger, menu, select);



    function actualizarOpciones() {

        const opcionSeleccionada =
            select.selectedOptions[0];

        value.textContent =
            opcionSeleccionada?.textContent.trim() ||
            'Seleccionar dirección';

        trigger.setAttribute(
            'aria-label',
            `Sentido de la devolución: ${value.textContent}`
        );

        menu.replaceChildren();

        Array.from(select.options).forEach(option => {

            const item = document.createElement('button');

            item.type = 'button';

            item.className = 'inventory-premium-option';

            item.setAttribute('role', 'option');

            const seleccionado =
                option.value === select.value;

            item.setAttribute(
                'aria-selected',
                String(seleccionado)
            );

            const label = document.createElement('span');

            label.textContent = option.textContent.trim();

            const check = document.createElement('span');

            check.className = 'inventory-premium-check';

            check.textContent = '✓';

            item.append(label, check);

            if (seleccionado) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => {


                select.value = option.value;


                select.dispatchEvent(
                    new Event('change', {
                        bubbles: true
                    })
                );

                cerrarMenu();
            });

            menu.appendChild(item);
        });
    }



    function abrirMenu() {


        document.querySelectorAll(
            '.inventory-premium-select.open'
        ).forEach(otro => {

            if (otro !== wrapper) {

                otro.classList.remove('open');

                otro.querySelector(
                    '.inventory-premium-trigger'
                )?.setAttribute('aria-expanded', 'false');
            }
        });

        actualizarOpciones();

        wrapper.classList.add('open');

        trigger.setAttribute('aria-expanded', 'true');
    }



    function cerrarMenu() {

        wrapper.classList.remove('open');

        trigger.setAttribute('aria-expanded', 'false');
    }


    trigger.addEventListener('click', () => {

        if (wrapper.classList.contains('open')) {

            cerrarMenu();

        } else {

            abrirMenu();
        }
    });



    select.addEventListener('change', actualizarOpciones);

    actualizarOpciones();
}

async function cargarProximaReferenciaMovimiento(codigo) {

    const campo = document.getElementById('movementReference');

    if (!campo) return;

    const peticionActual = ++movementReferenceRequest;

    campo.value = 'Calculando...';

    try {

        const params = new URLSearchParams({ codigo });

        const response = await fetch(
            `/api/movimientos/proxima-referencia?${params}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.mensaje || 'No se pudo obtener el consecutivo.'
            );
        }


        if (
            peticionActual !== movementReferenceRequest ||
            movementDraft.codigoTipoMovimiento !== codigo
        ) {
            return;
        }

        campo.value = result.referencia;

    } catch (error) {

        if (peticionActual === movementReferenceRequest) {

            campo.value = 'No disponible';

            console.error(
                'Error consultando consecutivo:',
                error
            );

            showToast(
                'Error de consecutivo',
                error.message
            );
        }
    }
}

function inicializarSelectsEtiquetasPremium() {
    const ids = ['labelCode', 'labelFormat'];

    ids.forEach(id => {
        const select = document.getElementById(id);

        if (!select || select.dataset.labelPremiumReady === 'true') {
            return;
        }

        const wrapper = document.createElement('div');

        wrapper.className = 'label-premium-select';

        if (id === 'labelCode') {
            wrapper.classList.add('label-premium-select--product');
        }

        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        select.classList.add('label-premium-native');
        select.dataset.labelPremiumReady = 'true';


        const trigger = document.createElement('button');

        trigger.type = 'button';
        trigger.className = 'label-premium-select__trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const value = document.createElement('span');

        value.className = 'label-premium-select__value';

        const arrow = document.createElement('span');

        arrow.className = 'label-premium-select__arrow';
        arrow.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';

        trigger.append(value, arrow);


        const menu = document.createElement('div');

        menu.className = 'label-premium-select__menu';
        menu.setAttribute('role', 'listbox');


        const searchWrap = document.createElement('div');

        searchWrap.className = 'label-premium-select__search-wrap';

        const search = document.createElement('input');

        search.type = 'search';
        search.className = 'label-premium-select__search';
        search.placeholder = id === 'labelCode'
            ? 'Buscar prenda o código...'
            : 'Buscar formato...';
        search.autocomplete = 'off';
        search.setAttribute('aria-label', search.placeholder);

        searchWrap.appendChild(search);

        const optionsContainer = document.createElement('div');

        optionsContainer.className = 'label-premium-select__options';

        menu.append(searchWrap, optionsContainer);
        wrapper.append(trigger, menu);

        function actualizarOpciones() {
            const valorActual = select.value;

            value.textContent =
                select.selectedOptions[0]?.textContent?.trim() || 'Seleccionar';

            trigger.disabled = select.disabled;
            trigger.setAttribute('aria-disabled', String(select.disabled));

            optionsContainer.replaceChildren();

            const busqueda = search.value.trim().toLocaleLowerCase('es');

            const opciones = Array.from(select.options).filter(option =>
                option.textContent.toLocaleLowerCase('es').includes(busqueda)
            );

            opciones.forEach(option => {
                const item = document.createElement('button');

                item.type = 'button';
                item.className = 'label-premium-select__option';
                item.setAttribute('role', 'option');
                item.setAttribute(
                    'aria-selected',
                    String(option.value === valorActual)
                );
                item.disabled = option.disabled;

                if (option.value === valorActual) {
                    item.classList.add('selected');
                }

                const label = document.createElement('span');

                label.textContent = option.textContent.trim();

                const check = document.createElement('span');

                check.className = 'label-premium-select__check';
                check.textContent = '✓';
                check.setAttribute('aria-hidden', 'true');

                item.append(label, check);

                item.addEventListener('click', () => {
                    if (option.disabled) return;

                    select.value = option.value;


                    select.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );

                    actualizarOpciones();
                    cerrarMenu();
                });

                optionsContainer.appendChild(item);
            });

            if (opciones.length === 0) {
                const empty = document.createElement('div');

                empty.className = 'label-premium-select__empty';
                empty.textContent = 'No se encontraron opciones';

                optionsContainer.appendChild(empty);
            }
        }

        function cerrarMenu() {
            wrapper.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        function abrirMenu() {
            if (select.disabled) return;


            document.querySelectorAll(
                '.label-premium-select.open'
            ).forEach(otro => {
                if (otro !== wrapper) {
                    otro.classList.remove('open');
                    otro.querySelector(
                        '.label-premium-select__trigger'
                    )?.setAttribute('aria-expanded', 'false');
                }
            });

            actualizarOpciones();

            wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');

            search.value = '';
            actualizarOpciones();
            search.focus();
        }

        trigger.addEventListener('click', () => {
            if (wrapper.classList.contains('open')) {
                cerrarMenu();
            } else {
                abrirMenu();
            }
        });

        search.addEventListener('input', actualizarOpciones);

        select.addEventListener('change', actualizarOpciones);


        const observer = new MutationObserver(actualizarOpciones);

        observer.observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled']
        });


        select._refreshLabelPremium = actualizarOpciones;

        actualizarOpciones();
    });


    if (!document.documentElement.dataset.labelPremiumOutsideReady) {
        document.addEventListener('click', event => {
            if (event.target.closest('.label-premium-select')) {
                return;
            }

            document.querySelectorAll(
                '.label-premium-select.open'
            ).forEach(wrapper => {
                wrapper.classList.remove('open');

                wrapper.querySelector(
                    '.label-premium-select__trigger'
                )?.setAttribute('aria-expanded', 'false');
            });
        });

        document.documentElement.dataset.labelPremiumOutsideReady = 'true';
    }
}



function reproducirSonidoImpresora(cantidad) {
    const audio = document.getElementById('printerAudio');

    if (!audio) {
        return Promise.resolve();
    }

    const etiquetas = Math.max(1, parseInt(cantidad, 10) || 1);


    const duracionSegundos = Math.min(
        3 + Math.log2(etiquetas / 5) * 2,
        15
    );

    return new Promise(resolve => {
        let terminado = false;

        const finalizar = () => {
            if (terminado) return;
            terminado = true;

            clearTimeout(temporizador);
            audio.pause();
            audio.currentTime = 0;
            audio.loop = false;

            resolve();
        };

        const temporizador = setTimeout(
            finalizar,
            duracionSegundos * 1000
        );

        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;

        audio.play().catch(() => {
            finalizar();
        });
    });
}

function detenerSonidoImpresora() {
    const audio = document.getElementById('printerAudio');

    clearTimeout(temporizadorSonidoImpresora);
    temporizadorSonidoImpresora = null;

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
    }
}

async function imprimirEtiquetas() {
    const codigo = document.getElementById('labelCode')?.value.trim();
    const cantidad = Number(
        document.getElementById('labelQuantity')?.value
    );
    const formato = document.getElementById('labelFormat')?.value;
    const detalles = document.getElementById('labelDetails')?.textContent || '';

    if (!codigo) {
        showToast('Código requerido', 'Selecciona una prenda para imprimir.');
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 500) {
        showToast(
            'Cantidad no válida',
            'Ingresa una cantidad entre 1 y 500 etiquetas.'
        );
        return;
    }

    const area = document.getElementById('labelsPrintArea');

    if (!area) {
        showToast('Error de impresión', 'No se encontró el área de etiquetas.');
        return;
    }

    area.replaceChildren();
    area.dataset.formato = formato || 'thermal58';

    for (let i = 0; i < cantidad; i++) {
        const etiqueta = document.createElement('div');
        etiqueta.className = 'print-label';

        const marca = document.createElement('strong');
        marca.className = 'print-brand';
        marca.textContent = 'ABSOLUTELY NO BABY';

        const barras = document.createElement('div');
        barras.className = 'print-barcode';

        const svgBarras = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
        );

        dibujarCodigoBarras(svgBarras, codigo, {
            width: 1.5,
            height: 45,
            margin: 8
        });

        barras.appendChild(svgBarras);

        const codigoTexto = document.createElement('div');
        codigoTexto.className = 'print-code';
        codigoTexto.textContent = codigo;

        const detalleTexto = document.createElement('strong');
        detalleTexto.className = 'print-details';
        detalleTexto.textContent = detalles;

        etiqueta.append(marca, barras, codigoTexto, detalleTexto);
        area.appendChild(etiqueta);
    }

    const limpiarDespuesDeImprimir = () => {
        document.body.classList.remove('imprimiendo-etiquetas');
        area.replaceChildren();
        window.removeEventListener('afterprint', limpiarDespuesDeImprimir);
    };

    window.addEventListener('afterprint', limpiarDespuesDeImprimir);
    window.addEventListener('afterprint', () => {
        detenerSonidoImpresora();
    });
    document.body.classList.add('imprimiendo-etiquetas');

    await reproducirSonidoImpresora(cantidad);
    window.print();
}

function dibujarCodigoBarras(svg, codigo, opciones = {}) {
    if (!svg || !codigo) return;

    if (typeof window.JsBarcode !== 'function') {
        throw new Error(
            'JsBarcode no está cargado. Revisa su script en el HTML.'
        );
    }

    window.JsBarcode(svg, String(codigo), {
        format: 'CODE128',
        lineColor: '#000000',
        background: '#ffffff',
        width: 1.5,
        height: 44,
        displayValue: false,
        margin: 8,
        ...opciones
    });
}


async function prepararModalEtiquetas(codigoProducto, abrirModal = true) {
    if (!codigoProducto) {
        showToast(
            'Prenda requerida',
            'Selecciona una prenda del catálogo para generar su etiqueta.'
        );
        return;
    }

    try {
        const respuesta = await fetch(
            `/api/productos/${encodeURIComponent(codigoProducto)}/edicion`
        );

        if (!respuesta.ok) {
            throw new Error('No fue posible consultar la prenda.');
        }

        const producto = await respuesta.json();

        const codigo = String(
            producto.codigoProducto || codigoProducto
        );

        const precioNumero =
            producto.precio == null ? null : Number(producto.precio);

        const precioTexto =
            precioNumero !== null && Number.isFinite(precioNumero)
                ? `$ ${precioNumero.toLocaleString('es-CO', {
                    maximumFractionDigits: 0
                })}`
                : 'Precio no disponible';

        const campoCodigo = document.getElementById('labelCode');
        const campoPrecio = document.getElementById('labelPrice');
        const codigoVista = document.getElementById('labelBarcodeText');
        const codigoBarrasSvg = document.getElementById('labelBarcodeSvg');
        const detallesVista = document.getElementById('labelDetails');
        const cantidad = document.getElementById('labelQuantity');


        if (campoCodigo) {
            const existe = Array.from(campoCodigo.options).some(
                opcion => opcion.value === codigo
            );


            if (!existe) {
                campoCodigo.add(
                    new Option(
                        `${producto.nombre || 'Prenda'} · ${codigo}`,
                        codigo
                    )
                );
            }

            campoCodigo.value = codigo;
            campoCodigo._refreshLabelPremium?.();
        }

        if (campoPrecio) {
            campoPrecio.value = precioTexto;
        }

        if (codigoVista) {
            codigoVista.textContent = codigo;
        }

        dibujarCodigoBarras(codigoBarrasSvg, codigo, {
            width: 1.5,
            height: 38,
            margin: 8
        });

        if (detallesVista) {
            detallesVista.textContent = [
                producto.nombre || 'Prenda',
                producto.talla || 'Sin talla',
                producto.color || 'Sin color',
                precioTexto
            ].join(' · ');
        }

        if (
            cantidad &&
            (
                !Number.isInteger(Number(cantidad.value)) ||
                Number(cantidad.value) < 1 ||
                Number(cantidad.value) > 500
            )
        ) {
            cantidad.value = '10';
        }

        if (abrirModal) {
            openModal('labels');
        }

    } catch (error) {
        console.error('Error al preparar las etiquetas:', error);
        showToast('Error al preparar etiquetas', error.message);
    }
}


async function cargarSelectorPrendasEtiquetas(codigoSeleccionado = '') {
    const select = document.getElementById('labelCode');
    if (!select) return;

    select.disabled = true;
    select.replaceChildren(
        new Option('Cargando prendas registradas...', '')
    );

    try {
        const respuesta = await fetch('/api/productos/inventario');

        if (!respuesta.ok) {
            throw new Error('No fue posible cargar las prendas del inventario.');
        }

        const productos = await respuesta.json();

        select.replaceChildren(
            new Option('Selecciona una prenda...', '')
        );

        productos.forEach(producto => {
            const codigo = String(producto.codigoProducto ?? '').trim();

            if (!codigo) return;

            const nombre = producto.nombre || 'Prenda sin nombre';
            const talla = producto.talla || 'Sin talla';
            const color = producto.color || 'Sin color';

            const texto =
                `${nombre} · ${codigo} · ${talla} · ${color}`;

            select.add(new Option(texto, codigo));
        });

        if (codigoSeleccionado) {
            select.value = String(codigoSeleccionado);
        }

        select.disabled = false;
        select._refreshLabelPremium?.();

        if (productos.length === 0) {
            select.replaceChildren(
                new Option('No hay prendas registradas', '')
            );
            select.disabled = true;
        }

    } catch (error) {
        console.error('Error al cargar prendas para etiquetas:', error);

        select.replaceChildren(
            new Option('No fue posible cargar las prendas', '')
        );

        select.disabled = true;

        showToast('Error de catálogo', error.message);
        throw error;
    }
}

async function abrirModalEtiquetas(codigoProducto = '') {
    try {
        await cargarSelectorPrendasEtiquetas(codigoProducto);

        if (codigoProducto) {

            await prepararModalEtiquetas(codigoProducto);
            return;
        }


        const campoPrecio = document.getElementById('labelPrice');
        const codigoVista = document.getElementById('labelBarcodeText');
        const codigoSvg = document.getElementById('labelBarcodeSvg');
        const detalles = document.getElementById('labelDetails');

        if (campoPrecio) campoPrecio.value = '';
        if (codigoVista) codigoVista.textContent = 'Seleccione una prenda';
        if (codigoSvg) codigoSvg.replaceChildren();
        if (detalles) detalles.textContent = 'Talla · Color · Precio';

        openModal('labels');

    } catch (error) {

        console.error('No se pudo abrir el modal de etiquetas:', error);
    }
}

function obtenerTallasCatalogo() {
    return [...new Set(
        Object.values(tallasPorModelo).flat()
    )];
}

async function cargarOpcionesCatalogo(url, selectId, textoInicial, campoNombre) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error consultando ${url}`);
        }

        const registros = await respuesta.json();

        select.replaceChildren(new Option(textoInicial, ""));

        registros.forEach(registro => {
            const nombre = registro[campoNombre];

            if (nombre) {
                select.add(new Option(nombre, nombre));
            }
        });
    } catch (error) {
        console.error(`No se pudo cargar el catálogo ${selectId}:`, error);
    }
}

function cargarFiltroTallas() {
    const select = document.getElementById("sizeFilter");
    if (!select) return;

    select.replaceChildren(new Option("Todas las tallas", ""));

    obtenerTallasCatalogo().forEach(talla => {
        select.add(new Option(talla, talla));
    });
}

async function cargarFiltrosInventario() {
    cargarFiltroTallas();

    await Promise.all([
        cargarOpcionesCatalogo(
            "/api/productos/grupos",
            "groupFilter",
            "Todos los grupos",
            "nombre"
        ),
        cargarOpcionesCatalogo(
            "/api/productos/tipos",
            "typeFilter",
            "Todos los tipos",
            "nombre"
        )
    ]);
}

function setView(viewName) {
    const target = document.querySelector(`[data-section="${viewName}"]`);
    if (!target) return;

    document.querySelectorAll('[data-section]').forEach((section) => {
        section.classList.toggle('active', section.dataset.section === viewName);
    });

    document.querySelectorAll('.nav-tab[data-view]').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    navTabs.classList.remove('open');
    document.getElementById('mobileBtn').setAttribute('aria-expanded', 'false');

    if (viewName === 'transfers') {
        void cargarTransferencias();
    }

    if (viewName === 'counts') {
        cargarConteosFisicos();
    }
}

function prepararConsultaEscaner() {
    const input = document.getElementById('barcodeInput');
    const resultado = document.getElementById('barcodeResult');

    if (scannerReadTimer !== null) {
        clearTimeout(scannerReadTimer);
        scannerReadTimer = null;
    }

    if (input) {
        input.value = '';
        input.placeholder = 'Escanea o escribe el código…';
    }

    if (resultado) {
        resultado.innerHTML = `
            <div class="scanner-empty-state">
                <div class="scanner-empty-icon">
                    <i class="fa-solid fa-barcode" aria-hidden="true"></i>
                </div>

                <strong>Esperando una lectura</strong>

                <p>El resultado del producto aparecerá aquí.</p>
            </div>
        `;
    }

    actualizarEstadoLector(
        'ready',
        'Lector preparado',
        'Escanea un código de barras para consultar su producto.'
    );

    input?.focus();
}

function openModal(name, relatedId = null) {
    const content = modal.querySelectorAll('[data-modal-content]');
    content.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.modalContent !== name);
    });
    modalBackdrop.classList.remove('hidden');
    document.getElementById('storeMenu').classList.remove('open');
    document.getElementById('userMenu').classList.remove('open');

    if (name === 'movement') {
        prepararModalMovimiento();
    }

    if (name === 'transfer') {
        void prepararModalTransferencia();
    }

    if (name === 'detail-transfer' && relatedId) {
        void cargarDetalleTransferencia(Number(relatedId));
    }

    if (name === 'barcode') {
        const input = document.getElementById('barcodeInput');
        activarAudioLector();
        prepararConsultaEscaner();
        window.setTimeout(() => input?.focus(), 0);
    }
}

function closeModal() {
    detenerLectorCamara(false);

    window.clearTimeout(transferSearchTimer);

    transferSearchRequest++;

    modalBackdrop.classList.add('hidden');

    modal.querySelectorAll('[data-modal-content]').forEach(panel => {
        panel.classList.add('hidden');
    });
}

function showToast(title, message) {
    const template = document.getElementById('toastTemplate');
    const toast = template.content.firstElementChild.cloneNode(true);
    toast.querySelector('[data-toast-title]').textContent = title;
    toast.querySelector('[data-toast-message]').textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3000);
}





function obtenerDeltaMovimiento(item) {

    const cantidad = Number(item.cantidad);

    if (!Number.isInteger(cantidad) || cantidad === 0) {
        return 0;
    }

    switch (movementDraft.codigoTipoMovimiento) {

        case 'ENT':
            return Math.abs(cantidad);

        case 'SAL':
            return -Math.abs(cantidad);

        case 'AJU':
            return cantidad;

        case 'DEV':
            return movementDraft.direccionDevolucion === 'ENTRADA'
                ? Math.abs(cantidad)
                : -Math.abs(cantidad);

        default:
            return 0;
    }
}






function seleccionarTipoMovimiento(codigo) {

    if (!MOVEMENT_TYPE_CODES.includes(codigo)) return;

    movementDraft.codigoTipoMovimiento = codigo;



    if (codigo !== 'AJU') {

        movementDraft.detalles.forEach(item => {

            const cantidad =
                Math.abs(Number(item.cantidad)) || 1;

            item.cantidad = String(cantidad);
        });
    }

    document.querySelectorAll('[data-movement-type]')
        .forEach(button => {

            const activo =
                button.dataset.movementType === codigo;

            button.classList.toggle('is-active', activo);

            button.setAttribute(
                'aria-pressed',
                String(activo)
            );
        });

    document.getElementById('movementReturnDirection')
        ?.classList.toggle('hidden', codigo !== 'DEV');

    renderizarDetallesMovimiento();
    cargarProximaReferenciaMovimiento(codigo);
}

function resetearModalMovimiento() {

    window.clearTimeout(movementSearchTimer);
    movementSearchRequest++;

    movementDraft = {
        codigoTipoMovimiento: 'ENT',
        direccionDevolucion: 'ENTRADA',
        detalles: []
    };

    movementSearchResults = [];
    movementTypesReady = false;

    const search = document.getElementById(
        'movementVariantSearch'
    );

    const reference = document.getElementById(
        'movementReference'
    );

    const observation = document.getElementById(
        'movementObservation'
    );

    const direction = document.getElementById(
        'movementReturnDirectionSelect'
    );

    const results = document.getElementById(
        'movementVariantResults'
    );

    if (search) search.value = '';
    if (reference) reference.value = '';
    if (observation) observation.value = '';

    if (direction) {
        direction.value = 'ENTRADA';
        direction.dispatchEvent(
            new Event('change', {
                bubbles: true
            })
        );
    }

    if (results) {
        results.replaceChildren();
        results.classList.add('hidden');
    }

    seleccionarTipoMovimiento('ENT');

    renderizarDetallesMovimiento();

    const button = document.querySelector(
        '[data-save-movement]'
    );

    if (button) {

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Confirmar movimiento
        `;
    }
}

async function cargarCatalogosMovimiento() {

    movementTypesReady = false;


    const sucursalNombre = document.getElementById(
        'movementCurrentBranchName'
    );

    const sucursalMeta = document.getElementById(
        'movementCurrentBranchMeta'
    );

    const usuarioNombre = document.getElementById(
        'movementCurrentUserName'
    );

    const usuarioMeta = document.getElementById(
        'movementCurrentUserMeta'
    );


    const elementos = {
        movementCurrentBranchName: sucursalNombre,
        movementCurrentBranchMeta: sucursalMeta,
        movementCurrentUserName: usuarioNombre,
        movementCurrentUserMeta: usuarioMeta
    };

    const faltantes = Object.entries(elementos)
        .filter(([, elemento]) => !elemento)
        .map(([id]) => id);

    if (faltantes.length > 0) {
        console.error(
            'No se encontraron estos elementos del modal:',
            faltantes
        );

        showToast(
            'Error en el modal',
            `No se encontraron elementos HTML: ${faltantes.join(', ')}`
        );

        return;
    }


    sucursalNombre.textContent = 'Consultando sucursal...';
    sucursalMeta.textContent = 'Verificando sucursal asignada';

    usuarioNombre.textContent = 'Consultando sesión...';
    usuarioMeta.textContent = 'Verificando usuario autenticado';

    try {


        const [
            tiposResponse,
            usuario
        ] = await Promise.all([
            fetch('/api/tipos-movimiento'),
            obtenerUsuarioSesionActual()
        ]);

        if (!usuarioResponse.ok) {
            throw new Error(
                'No fue posible consultar el usuario autenticado.'
            );
        }

        if (!tiposResponse.ok) {
            throw new Error(
                'No fue posible consultar los tipos de movimiento.'
            );
        }

        const tipos = await tiposResponse.json();


        if (!usuario.sucursalId || !usuario.sucursal) {
            throw new Error(
                'Tu cuenta no tiene una sucursal asignada.'
            );
        }


        const codigosActivos = new Set(
            tipos
                .filter(tipo =>
                    tipo.activo === true &&
                    MOVEMENT_TYPE_CODES.includes(tipo.codigo)
                )
                .map(tipo => tipo.codigo)
        );

        movementTypesReady = MOVEMENT_TYPE_CODES.every(
            codigo => codigosActivos.has(codigo)
        );


        sucursalNombre.textContent = usuario.sucursal;

        sucursalMeta.textContent =
            `Sucursal asignada a tu cuenta · ID ${usuario.sucursalId}`;


        usuarioNombre.textContent =
            `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()
            || usuario.email
            || 'Usuario autenticado';

        usuarioMeta.textContent =
            `${(usuario.rol ?? 'Usuario').replaceAll('_', ' ')} · ${usuario.email ?? ''}`;

        if (!movementTypesReady) {
            throw new Error(
                'Faltan uno o varios tipos de movimiento activos.'
            );
        }

        console.log(
            'Contexto del movimiento cargado correctamente:',
            {
                usuario: usuario.nombre,
                usuarioId: usuario.idUsuario,
                sucursal: usuario.sucursal,
                sucursalId: usuario.sucursalId
            }
        );

    } catch (error) {

        console.error(
            'Error cargando contexto del movimiento:',
            error
        );


        if (usuarioNombre) {
            usuarioNombre.textContent = 'Sesión no disponible';
        }

        if (usuarioMeta) {
            usuarioMeta.textContent = error.message;
        }

        if (sucursalNombre) {
            sucursalNombre.textContent = 'Sucursal no disponible';
        }

        if (sucursalMeta) {
            sucursalMeta.textContent =
                'No fue posible verificar la sucursal asignada.';
        }

        showToast(
            'Error al preparar el movimiento',
            error.message
        );
    }
}

async function prepararModalMovimiento() {

    resetearModalMovimiento();

    await cargarCatalogosMovimiento();
}

function ocultarResultadosVariantes() {

    const results = document.getElementById(
        'movementVariantResults'
    );

    if (!results) return;

    results.replaceChildren();

    results.classList.add('hidden');
}

function limpiarBusquedaVariantesMovimiento(enfocar = false) {


    window.clearTimeout(movementSearchTimer);

    movementSearchTimer = null;


    movementSearchRequest++;


    movementSearchResults = [];


    const search = document.getElementById(
        'movementVariantSearch'
    );

    if (search) {

        search.value = '';


        if (enfocar) {
            search.focus();
        }
    }


    ocultarResultadosVariantes();
}

async function buscarVariantesMovimiento(termino) {

    const results = document.getElementById(
        'movementVariantResults'
    );

    if (!results) return;


    const requestId = ++movementSearchRequest;

    if (termino.length < 2) {

        movementSearchResults = [];

        ocultarResultadosVariantes();

        return;
    }

    results.innerHTML = `
        <div class="movement-variant-empty">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Buscando variantes...
        </div>
    `;

    results.classList.remove('hidden');

    try {

        const params = new URLSearchParams({
            q: termino
        });

        const response = await fetch(
            `/api/movimientos/variantes?${params.toString()}`
        );

        const data = await response.json().catch(() => []);


        if (requestId !== movementSearchRequest) {
            return;
        }

        if (!response.ok) {

            throw new Error(
                data.mensaje ||
                'No fue posible buscar las variantes.'
            );
        }

        movementSearchResults = Array.isArray(data) ? data : [];

        if (!movementSearchResults.length) {

            results.innerHTML = `
                <div class="movement-variant-empty">
                    No encontramos variantes activas.
                </div>
            `;

            return;
        }

        results.innerHTML = movementSearchResults.map(item => {

            const yaAgregada =
                movementDraft.detalles.some(linea =>
                    linea.idProductoVariante === item.idProductoVariante
                );

            return `

                <button
                    class="movement-variant-option"
                    type="button"
                    data-add-movement-variant="${item.idProductoVariante}"
                    ${yaAgregada ? 'disabled' : ''}>

                    <span class="movement-variant-main">

                        <b>
                            ${escapeHTML(item.nombreProducto)}
                            · ${escapeHTML(item.codigoProducto)}
                        </b>

                        <small>
                            ${escapeHTML(item.codigoBarras)}
                            · Talla ${escapeHTML(item.talla)}
                            · ${escapeHTML(item.color)}
                        </small>

                    </span>

                    <span class="movement-variant-stock">

                        <b>
                            ${Number(item.existenciaActual) || 0}
                        </b>

                        <small>
                            ${yaAgregada ? 'Agregada' : 'Disponibles'}
                        </small>

                    </span>

                </button>

            `;

        }).join('');

    } catch (error) {

        if (requestId !== movementSearchRequest) {
            return;
        }

        results.innerHTML = `
            <div class="movement-variant-empty">
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}

function agregarVarianteMovimiento(id) {

    const variante = movementSearchResults.find(
        item => Number(item.idProductoVariante) === id
    );

    if (!variante) return;

    const existe = movementDraft.detalles.some(
        item => item.idProductoVariante === id
    );

    if (existe) return;


    movementDraft.detalles.push({

        ...variante,

        cantidad: '1'
    });


    renderizarDetallesMovimiento();



    limpiarBusquedaVariantesMovimiento(true);
}

function renderizarDetallesMovimiento() {

    const container = document.getElementById(
        'movementSelectedItems'
    );

    if (!container) return;

    const codigo = movementDraft.codigoTipoMovimiento;

    const esAjuste = codigo === 'AJU';

    const etiquetaCantidad = esAjuste
        ? 'Diferencia (+ / −)'
        : 'Cantidad';

    if (!movementDraft.detalles.length) {

        container.innerHTML = `

            <div class="movement-empty-state">

                <span>
                    <i class="fa-solid fa-boxes-stacked"></i>
                </span>

                <b>Aún no has agregado prendas</b>

                <small>
                    Busca una referencia arriba y selecciona
                    las tallas y colores que vas a mover.
                </small>

            </div>
        `;

    } else {

        container.innerHTML = movementDraft.detalles.map(item => {

            const cantidad = Number(item.cantidad);

            const cantidadValida =
                Number.isInteger(cantidad) &&
                (esAjuste ? cantidad !== 0 : cantidad > 0);

            const delta = cantidadValida
                ? obtenerDeltaMovimiento(item)
                : 0;

            const anterior =
                Number(item.existenciaActual) || 0;

            const nueva = anterior + delta;

            const invalida =
                !cantidadValida || nueva < 0;

            const cantidadInput = esAjuste
                ? (Number.isInteger(cantidad) ? cantidad : 1)
                : (Number.isInteger(cantidad) && cantidad > 0
                    ? cantidad
                    : 1);

            const signo = delta > 0 ? '+' : '';

            return `

                <article class="movement-line ${invalida ? 'is-invalid' : ''}">

                    <div class="movement-line-main">

                        <span class="movement-line-symbol">
                            <i class="fa-solid fa-shirt"></i>
                        </span>

                        <span class="movement-line-copy">

                            <b>${escapeHTML(item.nombreProducto)}</b>

                            <small>
                                ${escapeHTML(item.codigoProducto)}
                                · ${escapeHTML(item.codigoBarras)}
                            </small>

                            <small>
                                Talla ${escapeHTML(item.talla)}
                                · ${escapeHTML(item.color)}
                            </small>

                            <span class="movement-line-stock">
                                Existencia actual: ${anterior}
                            </span>

                        </span>

                    </div>

                    <div class="movement-line-quantity">

                        <label>${etiquetaCantidad}</label>

                        <input
                            type="number"
                            step="1"
                            ${esAjuste ? '' : 'min="1"'}
                            data-movement-quantity="${item.idProductoVariante}"
                            value="${escapeHTML(cantidadInput)}"
                        />

                    </div>

                    <button
                        class="movement-line-remove"
                        type="button"
                        data-remove-movement-variant="${item.idProductoVariante}"
                        aria-label="Quitar variante">

                        <i class="fa-solid fa-trash-can"></i>

                    </button>

                    <div class="movement-line-after">

                        <span>
                            Variación:
                            <b>
                                ${cantidadValida ? `${signo}${delta}` : '—'}
                            </b>
                        </span>

                        <span>
                            Existencia resultante:
                            <b class="${invalida ? 'negative' : ''}">
                                ${cantidadValida ? nueva : '—'}
                            </b>
                        </span>

                    </div>

                </article>
            `;

        }).join('');
    }



    const referencias = movementDraft.detalles.length;

    let unidadesIngresan = 0;
    let unidadesSalen = 0;
    let tieneError = false;

    movementDraft.detalles.forEach(item => {

        const cantidad = Number(item.cantidad);

        const valida =
            Number.isInteger(cantidad) &&
            (esAjuste ? cantidad !== 0 : cantidad > 0);

        if (!valida) {
            tieneError = true;
            return;
        }

        const delta = obtenerDeltaMovimiento(item);

        if ((Number(item.existenciaActual) || 0) + delta < 0) {
            tieneError = true;
        }

        if (delta > 0) {
            unidadesIngresan += delta;
        }

        if (delta < 0) {
            unidadesSalen += Math.abs(delta);
        }

    });

    document.getElementById('movementItemCount').textContent =
        `${referencias} ${referencias === 1 ? 'REFERENCIA' : 'REFERENCIAS'}`;

    document.getElementById('movementSummaryItems').textContent =
        String(referencias);

    document.getElementById('movementSummaryIn').textContent =
        String(unidadesIngresan);

    document.getElementById('movementSummaryOut').textContent =
        String(unidadesSalen);

    const message = document.getElementById(
        'movementSummaryMessage'
    );

    if (tieneError) {

        message.textContent =
            'Revisa las cantidades: deben ser válidas y ninguna salida puede superar la existencia disponible.';

        message.classList.add('is-error');

    } else {

        message.classList.remove('is-error');

        message.textContent = referencias
            ? 'Las cantidades son válidas. El inventario se actualizará al confirmar la operación.'
            : 'Agrega al menos una variante para calcular el impacto de esta operación.';
    }
}

async function guardarMovimientoDesdeModal() {

    if (movementSaving) return;

    const boton = document.querySelector(
        '[data-save-movement]'
    );

    const codigo = movementDraft.codigoTipoMovimiento;

    const direccionDevolucion = document
        .getElementById('movementReturnDirectionSelect')
        ?.value;

    if (!movementTypesReady) {

        showToast(
            'Tipos pendientes',
            'Registra ENT, SAL, AJU y DEV en la base de datos.'
        );

        return;
    }

    if (!movementDraft.detalles.length) {

        showToast(
            'Agrega productos',
            'El movimiento debe contener al menos una variante.'
        );

        return;
    }

    if (
        codigo === 'DEV' &&
        !['ENTRADA', 'SALIDA'].includes(direccionDevolucion)
    ) {

        showToast(
            'Define la devolución',
            'Indica si ingresa a la tienda o sale hacia el proveedor.'
        );

        return;
    }

    const detalles = movementDraft.detalles.map(item => ({

        productoVarianteId: item.idProductoVariante,

        cantidad: Number(item.cantidad)
    }));

    const detalleInvalido = detalles.some(linea =>

        !Number.isInteger(linea.cantidad) ||

        (codigo === 'AJU'
            ? linea.cantidad === 0
            : linea.cantidad <= 0)
    );

    const stockInsuficiente = movementDraft.detalles.some(item =>

        (Number(item.existenciaActual) || 0)
        + obtenerDeltaMovimiento(item) < 0
    );

    if (detalleInvalido || stockInsuficiente) {

        showToast(
            'Revisa las cantidades',
            'Corrige las cantidades y verifica las existencias.'
        );

        return;
    }



    const payload = {

        codigoTipoMovimiento: codigo,

        direccionDevolucion:
            codigo === 'DEV'
                ? direccionDevolucion
                : null,

        observacion:
            document.getElementById('movementObservation')
                ?.value.trim() || null,

        detalles
    };

    movementSaving = true;

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Registrando...
        `;
    }

    try {

        const response = await fetch(
            '/api/movimientos/registrar',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload)
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                result.mensaje ||
                result.detail ||
                'No fue posible registrar el movimiento.'
            );
        }

        closeModal();

        showToast(
            'Movimiento aplicado',
            `${result.referencia} · Existencias actualizadas correctamente.`
        );

        document.dispatchEvent(
            new CustomEvent('anb:movimiento-guardado', {
                detail: { movimiento: result }
            })
        );

        await cargarHistorialMovimientos();

        movementDraft.detalles = [];

        ocultarResultadosVariantes();

    } catch (error) {

        showToast(
            'No se pudo registrar',
            error.message
        );

    } finally {

        movementSaving = false;

        if (boton) {

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Confirmar movimiento
            `;
        }
    }
}

function toggleDropdown(menu, button) {
    const shouldOpen = !menu.classList.contains('open');
    document.querySelectorAll('.dropdown').forEach((dropdown) => dropdown.classList.remove('open'));
    document.querySelectorAll('.selector').forEach((selector) => selector.setAttribute('aria-expanded', 'false'));
    if (shouldOpen) {
        menu.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
    }
}

async function obtenerUsuarioSesionActual() {


    if (usuarioSesionActual) {
        return usuarioSesionActual;
    }


    if (!usuarioSesionPromise) {

        usuarioSesionPromise = (async () => {

            const response = await fetch('/api/auth/me');

            if (response.status === 401) {

                window.location.replace('/login');

                throw new Error('Tu sesión ha expirado.');
            }

            const usuario = await response.json().catch(() => ({}));

            if (!response.ok) {

                throw new Error(
                    usuario.mensaje ||
                    'No fue posible consultar tu sesión.'
                );
            }

            if (!usuario.sucursalId || !usuario.sucursal) {

                throw new Error(
                    'Tu usuario no tiene una sucursal asignada.'
                );
            }

            usuarioSesionActual = usuario;

            return usuario;

        })().finally(() => {

            usuarioSesionPromise = null;

        });
    }

    return usuarioSesionPromise;
}

function formatearRolUsuario(rol) {

    return String(rol || 'Usuario')
        .replaceAll('_', ' ')
        .toLocaleLowerCase('es')
        .replace(
            /(^|\s)[a-záéíóúñ]/g,
            letra => letra.toLocaleUpperCase('es')
        );
}

function obtenerInicialesUsuario(usuario) {

    const iniciales = [
        usuario.nombre,
        usuario.apellido
    ]
        .filter(Boolean)
        .map(nombre => nombre.trim().charAt(0))
        .join('');

    return iniciales.toLocaleUpperCase('es') || 'U';
}

function actualizarEncabezadoSesion(usuario) {

    const nombreCompleto = [
        usuario.nombre,
        usuario.apellido
    ]
        .filter(Boolean)
        .join(' ')
        .trim();

    const nombre = nombreCompleto || usuario.email || 'Usuario';

    const sucursal = usuario.sucursal;

    const ciudad = usuario.sucursalCiudad || sucursal;

    const rol = formatearRolUsuario(usuario.rol);

    const iniciales = obtenerInicialesUsuario(usuario);






    document.getElementById('currentStore').textContent =
        sucursal;

    document.getElementById('storeMenuName').textContent =
        sucursal;

    document.getElementById('storeMenuCity').textContent =
        `${ciudad} · Sucursal #${usuario.sucursalId}`;



    document.querySelectorAll('[data-store-name]').forEach(elemento => {

        elemento.textContent = sucursal;

    });

    document.querySelectorAll('[data-store-municipality]').forEach(elemento => {

        elemento.textContent = ciudad;

    });






    document.getElementById('currentUserName').textContent =
        nombre;

    document.getElementById('currentUserRole').textContent =
        rol;

    document.getElementById('userAvatar').textContent =
        iniciales;






    document.getElementById('userMenuAvatar').textContent =
        iniciales;

    document.getElementById('userMenuName').textContent =
        nombre;

    document.getElementById('userMenuEmail').textContent =
        usuario.email || 'Correo no disponible';

    document.getElementById('userMenuRole').textContent =
        rol;

    document.getElementById('userMenuStore').textContent =
        sucursal;


    console.log('Sesión de ANB cargada:', {

        usuario: nombre,

        rol: usuario.rol,

        sucursal: sucursal,

        sucursalId: usuario.sucursalId

    });
}

async function inicializarEncabezadoSesion() {

    try {

        const usuario = await obtenerUsuarioSesionActual();

        actualizarEncabezadoSesion(usuario);

    } catch (error) {

        console.error(
            'Error cargando el encabezado:',
            error
        );

        showToast(
            'Error de sesión',
            error.message
        );
    }
}

async function cerrarSesionActual() {

    const boton = document.getElementById('logoutBtn');

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <span>
                <b>Cerrando sesión...</b>
                <small>Finalizando acceso</small>
            </span>

            <i class="fa-solid fa-spinner fa-spin"></i>
        `;
    }

    try {

        const response = await fetch('/api/auth/logout', {

            method: 'POST'

        });

        if (!response.ok && response.status !== 401) {

            throw new Error(
                'No fue posible cerrar la sesión.'
            );
        }

        usuarioSesionActual = null;

        window.location.replace('/login');

    } catch (error) {

        console.error('Error cerrando sesión:', error);

        showToast(
            'Error',
            error.message
        );

        if (boton) {

            boton.disabled = false;

            boton.innerHTML = `
                <span>
                    <b>Cerrar sesión</b>
                    <small>Salir de tu cuenta de forma segura</small>
                </span>

                <i class="fa-solid fa-right-from-bracket"></i>
            `;
        }
    }
}





let conteosFisicos = [];
let conteoFisicoActual = null;
let variantesBusquedaConteo = [];
let varianteSeleccionadaConteo = null;
let usuarioConteoActual = null;
let temporizadorBusquedaConteo = null;
let solicitudBusquedaConteo = 0;
let guardandoDetalleConteo = false;
let creandoConteo = false;
let aplicandoConteo = false;

const ROLES_APROBADORES_CONTEO = new Set([
    'AUXILIAR_INVENTARIO',
    'ENCARGADO_SUCURSAL'
]);

function normalizarEstadoConteo(estado) {
    return String(estado || '').trim().toUpperCase();
}

function rolPuedeAplicarConteo() {
    const rol = String(usuarioConteoActual?.rol || '')
        .trim()
        .toUpperCase();

    return ROLES_APROBADORES_CONTEO.has(rol);
}

async function respuestaConteo(response, mensajePredeterminado) {

    if (response.status === 401) {
        window.location.replace('/login');
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.mensaje ||
            data.message ||
            data.error ||
            mensajePredeterminado
        );
    }

    return data;
}

function formatoFechaConteo(valor, incluirHora = false) {

    if (!valor) return 'Fecha no disponible';

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat(
        'es-CO',
        incluirHora
            ? {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
            : {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
    ).format(fecha);
}

function claseEstadoConteo(estado) {

    switch (normalizarEstadoConteo(estado)) {

        case 'EN PROCESO':
            return 'amber';

        case 'POR APROBAR':
            return 'blue';

        case 'COMPLETADO':
            return 'green';

        case 'CANCELADO':
            return 'red';

        default:
            return '';
    }
}

function textoEstadoConteo(estado) {
    return normalizarEstadoConteo(estado) || 'SIN ESTADO';
}

function formatoIndicadorConteo(numero) {
    return String(Number(numero) || 0).padStart(2, '0');
}






async function cargarConteosFisicos() {

    const contenedor = document.getElementById('countCards');

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="count-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Consultando conteos de tu sucursal...</span>
        </div>
    `;

    try {

        const [
            conteosResponse,
            usuarioResponse
        ] = await Promise.all([

            fetch('/api/conteos-fisicos', {
                credentials: 'same-origin'
            }),

            fetch('/api/auth/me', {
                credentials: 'same-origin'
            })

        ]);

        const usuario = await respuestaConteo(
            usuarioResponse,
            'No fue posible consultar el usuario autenticado.'
        );

        const lista = await respuestaConteo(
            conteosResponse,
            'No fue posible cargar los conteos físicos.'
        );

        usuarioConteoActual = usuario;

        conteosFisicos = Array.isArray(lista)
            ? lista
            : [];

        const nombreSucursal =
            usuario.sucursal || 'Sucursal asignada';

        const branchLabel =
            document.getElementById('countBranchLabel');

        if (branchLabel) {
            branchLabel.textContent = nombreSucursal;
        }

        renderizarMetricasConteo();
        renderizarTarjetasConteo();

    } catch (error) {

        console.error(
            'Error al cargar los conteos físicos:',
            error
        );

        contenedor.innerHTML = `
            <div class="count-empty count-empty-error">

                <span class="count-empty-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </span>

                <strong>No pudimos cargar los conteos</strong>

                <p>${escapeHTML(error.message)}</p>

                <button
                    class="btn"
                    type="button"
                    data-count-reload
                >
                    <i class="fa-solid fa-rotate-right"></i>
                    Reintentar
                </button>

            </div>
        `;
    }
}






function renderizarMetricasConteo() {

    const total = conteosFisicos.length;

    const enProceso = conteosFisicos.filter(
        item =>
            normalizarEstadoConteo(item.estado) === 'EN PROCESO'
    ).length;

    const porAprobar = conteosFisicos.filter(
        item =>
            normalizarEstadoConteo(item.estado) === 'POR APROBAR'
    ).length;

    const completados = conteosFisicos.filter(
        item =>
            normalizarEstadoConteo(item.estado) === 'COMPLETADO'
    ).length;

    const valores = {
        countMetricTotal: total,
        countMetricProgress: enProceso,
        countMetricApproval: porAprobar,
        countMetricCompleted: completados
    };

    Object.entries(valores).forEach(([id, valor]) => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = formatoIndicadorConteo(valor);
        }

    });
}






function renderizarTarjetasConteo() {

    const contenedor = document.getElementById('countCards');

    if (!contenedor) return;

    const filtro =
        document.getElementById('countStatusFilter')?.value || '';

    const lista = conteosFisicos.filter(item =>
        !filtro ||
        normalizarEstadoConteo(item.estado) === filtro
    );

    if (!lista.length) {

        contenedor.innerHTML = `
            <div class="count-empty">

                <span class="count-empty-icon">
                    <i class="fa-solid fa-clipboard-check"></i>
                </span>

                <strong>
                    ${filtro
                ? 'No hay conteos con este estado'
                : 'Todavía no hay conteos físicos'}
                </strong>

                <p>
                    ${filtro
                ? 'Prueba con otro filtro para consultar las demás sesiones.'
                : 'Crea una sesión para comenzar a conciliar las existencias de tu sucursal.'}
                </p>

                ${!filtro ? `
                    <button
                        class="btn btn-red"
                        type="button"
                        data-action="count"
                    >
                        <i class="fa-solid fa-plus"></i>
                        Crear primer conteo
                    </button>
                ` : ''}

            </div>
        `;

        return;
    }

    contenedor.innerHTML = lista.map(item => {

        const estado = normalizarEstadoConteo(item.estado);

        const porcentaje = Math.max(
            0,
            Math.min(100, Number(item.porcentaje) || 0)
        );

        const contadas = Number(item.variantesContadas) || 0;
        const total = Number(item.totalVariantes) || 0;
        const diferencias = Number(item.diferencias) || 0;
        const sobrantes = Number(item.sobrantes) || 0;
        const faltantes = Number(item.faltantes) || 0;

        const puedeAplicar =
            estado === 'POR APROBAR' &&
            rolPuedeAplicarConteo();

        const textoAccion =
            estado === 'EN PROCESO'
                ? 'Continuar conteo'
                : estado === 'POR APROBAR'
                    ? 'Revisar conteo'
                    : 'Ver detalle';

        return `
            <article
                class="count-card"
                data-count-status="${escapeHTML(estado)}"
            >

                <div class="count-card-head">

                    <div class="count-card-identification">

                        <span class="count-reference">
                            ${escapeHTML(
            item.referencia || 'CON-' + item.id
        )}
                        </span>

                        <span class="count-card-date">
                            ${escapeHTML(item.sucursal || '')}
                            ·
                            ${escapeHTML(
            formatoFechaConteo(item.fechaInicio)
        )}
                        </span>

                    </div>

                    <span class="pill ${claseEstadoConteo(estado)}">
                        ${escapeHTML(textoEstadoConteo(estado))}
                    </span>

                </div>

                <div class="count-card-body">

                    <div class="count-progress-heading">

                        <div>
                            <span class="count-muted-label">
                                Responsable
                            </span>

                            <strong>
                                ${escapeHTML(
            item.responsable || 'No disponible'
        )}
                            </strong>
                        </div>

                        <strong class="count-percent">
                            ${porcentaje}%
                        </strong>

                    </div>

                    <div
                        class="count-progress-track"
                        role="progressbar"
                        aria-valuenow="${porcentaje}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        <span style="width:${porcentaje}%"></span>
                    </div>

                    <div class="count-progress-caption">
                        <span>${contadas} / ${total} variantes</span>
                        <span>${Math.max(0, total - contadas)} pendientes</span>
                    </div>

                    <div class="count-card-metrics">

                        <div>
                            <strong>${diferencias}</strong>
                            <span>Diferencias</span>
                        </div>

                        <div>
                            <strong class="count-positive">
                                +${sobrantes}
                            </strong>
                            <span>Sobrantes</span>
                        </div>

                        <div>
                            <strong class="count-negative">
                                -${faltantes}
                            </strong>
                            <span>Faltantes</span>
                        </div>

                    </div>

                    <div class="count-card-footer">

                        <button
                            class="btn"
                            type="button"
                            data-action="open-count"
                            data-id="${Number(item.id)}"
                        >
                            <i class="fa-regular fa-folder-open"></i>
                            ${textoAccion}
                        </button>

                        ${puedeAplicar ? `
                            <button
                                class="btn btn-red"
                                type="button"
                                data-action="apply-count"
                                data-id="${Number(item.id)}"
                            >
                                <i class="fa-solid fa-check"></i>
                                Aprobar y aplicar
                            </button>
                        ` : ''}

                        ${estado === 'POR APROBAR' &&
                !rolPuedeAplicarConteo()
                ? `
                                <span class="count-permission-note">
                                    <i class="fa-solid fa-lock"></i>
                                    Requiere AUXILIAR o ENCARGADO
                                </span>
                            `
                : ''}

                    </div>

                </div>

            </article>
        `;

    }).join('');
}






function abrirNuevoConteoFisico() {

    const campo =
        document.getElementById('countObservation');

    if (campo) {
        campo.value = '';
    }

    openModal('count-new');
}

async function crearConteoFisico() {

    if (creandoConteo) return;

    const boton =
        document.querySelector('[data-count-create]');

    const observacion =
        document.getElementById('countObservation')?.value.trim() || '';

    if (observacion.length > 1000) {

        showToast(
            'Observación demasiado larga',
            'Usa máximo 1.000 caracteres.'
        );

        return;
    }

    creandoConteo = true;

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creando...
        `;
    }

    try {

        const response = await fetch('/api/conteos-fisicos', {

            method: 'POST',

            credentials: 'same-origin',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                observacion
            })

        });

        const conteo = await respuestaConteo(
            response,
            'No fue posible crear la sesión de conteo.'
        );

        closeModal();

        const filtro =
            document.getElementById('countStatusFilter');

        if (filtro) {
            filtro.value = '';
        }

        showToast(
            'Conteo creado',
            `${conteo.referencia} · Ya puedes registrar las cantidades físicas.`
        );

        await cargarConteosFisicos();

        await abrirConteoFisico(conteo.id);

    } catch (error) {

        showToast(
            'No se pudo crear el conteo',
            error.message
        );

    } finally {

        creandoConteo = false;

        if (boton) {

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-plus"></i>
                Crear sesión
            `;
        }
    }
}





async function abrirConteoFisico(id) {

    if (!id) return;

    conteoFisicoActual = null;
    varianteSeleccionadaConteo = null;

    abrirModalCargandoConteo();

    try {

        const response = await fetch(
            `/api/conteos-fisicos/${encodeURIComponent(id)}`,
            {
                credentials: 'same-origin'
            }
        );

        const data = await respuestaConteo(
            response,
            'No fue posible consultar el conteo.'
        );

        conteoFisicoActual = data;

        renderizarDetalleConteoFisico();

    } catch (error) {

        closeModal();

        showToast(
            'No se pudo abrir el conteo',
            error.message
        );
    }
}


function abrirModalCargandoConteo() {

    openModal('count-detail');

    const summary =
        document.getElementById('countDetailSummary');

    const rows =
        document.getElementById('countDetailRows');

    document.getElementById('countCapturePanel')
        ?.classList.add('hidden');

    document.querySelector('[data-count-apply]')
        ?.classList.add('hidden');

    document.querySelector('[data-count-finalize]')
        ?.classList.add('hidden');

    if (summary) {
        summary.innerHTML = `
            <div class="count-loading">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                Cargando sesión...
            </div>
        `;
    }

    if (rows) {
        rows.innerHTML = `
            <tr>
                <td colspan="6" class="subtle">
                    Consultando registros...
                </td>
            </tr>
        `;
    }
}






function renderizarDetalleConteoFisico() {

    if (!conteoFisicoActual?.conteo) return;

    const conteo = conteoFisicoActual.conteo;

    const detalles = Array.isArray(conteoFisicoActual.detalles)
        ? conteoFisicoActual.detalles
        : [];

    const estado = normalizarEstadoConteo(conteo.estado);

    const enProceso = estado === 'EN PROCESO';
    const porAprobar = estado === 'POR APROBAR';

    const porcentaje = Math.max(
        0,
        Math.min(100, Number(conteo.porcentaje) || 0)
    );

    const title =
        document.getElementById('countDetailTitle');

    if (title) {
        title.textContent =
            `${conteo.referencia || 'Conteo físico'} · ${textoEstadoConteo(estado)}`;
    }

    const summary =
        document.getElementById('countDetailSummary');

    if (summary) {

        summary.innerHTML = `

            <div class="count-detail-hero">

                <div class="count-detail-hero-top">

                    <div>

                        <span class="count-muted-label">
                            ${escapeHTML(conteo.sucursal || '')}
                        </span>

                        <h4>
                            ${escapeHTML(conteo.referencia || 'Conteo físico')}
                        </h4>

                        <p>
                            Iniciado
                            ${escapeHTML(
            formatoFechaConteo(conteo.fechaInicio, true)
        )}
                            · Responsable:
                            ${escapeHTML(conteo.responsable || '—')}
                        </p>

                    </div>

                    <span class="pill ${claseEstadoConteo(estado)}">
                        ${escapeHTML(textoEstadoConteo(estado))}
                    </span>

                </div>

                <div class="count-detail-progress-head">

                    <strong>${porcentaje}% completado</strong>

                    <span>
                        ${Number(conteo.variantesContadas) || 0}
                        de
                        ${Number(conteo.totalVariantes) || 0}
                        variantes
                    </span>

                </div>

                <div class="count-progress-track">
                    <span style="width:${porcentaje}%"></span>
                </div>

                <div class="count-card-metrics count-detail-metrics">

                    <div>
                        <strong>
                            ${Number(conteo.diferencias) || 0}
                        </strong>
                        <span>Diferencias</span>
                    </div>

                    <div>
                        <strong class="count-positive">
                            +${Number(conteo.sobrantes) || 0}
                        </strong>
                        <span>Sobrantes</span>
                    </div>

                    <div>
                        <strong class="count-negative">
                            -${Number(conteo.faltantes) || 0}
                        </strong>
                        <span>Faltantes</span>
                    </div>

                </div>

                ${conteo.observacion ? `
                    <p class="count-observation">
                        <b>Observación:</b>
                        ${escapeHTML(conteo.observacion)}
                    </p>
                ` : ''}

            </div>

        `;
    }


    const searchPanel =
        document.getElementById('countCapturePanel');

    if (searchPanel) {
        searchPanel.classList.toggle('hidden', !enProceso);
    }

    const searchInput =
        document.getElementById('countVariantSearch');

    if (searchInput && !enProceso) {
        searchInput.value = '';
    }


    const applyButton =
        document.querySelector('[data-count-apply]');

    if (applyButton) {

        applyButton.classList.toggle(
            'hidden',
            !porAprobar || !rolPuedeAplicarConteo()
        );

        applyButton.disabled = aplicandoConteo;
    }



    const finalizeButton =
        document.querySelector('[data-count-finalize]');

    const total = Number(conteo.totalVariantes) || 0;
    const contadas = Number(conteo.variantesContadas) || 0;

    const faltan = Math.max(0, total - contadas);

    if (finalizeButton) {

        finalizeButton.classList.toggle(
            'hidden',
            !enProceso
        );

        finalizeButton.disabled =
            !enProceso || total === 0 || faltan > 0;
    }

    const finalizeHint =
        document.getElementById('countFinalizeHint');

    if (finalizeHint) {

        finalizeHint.textContent = enProceso

            ? (
                faltan > 0
                    ? `Faltan ${faltan} variantes por registrar antes de enviar a aprobación.`
                    : 'Todas las variantes están registradas. Puedes enviar el conteo a aprobación.'
            )

            : porAprobar

                ? (
                    rolPuedeAplicarConteo()
                        ? 'Revisa las diferencias y aplica los ajustes cuando estés seguro.'
                        : 'Este conteo está esperando a un AUXILIAR_INVENTARIO o ENCARGADO_SUCURSAL.'
                )

                : estado === 'COMPLETADO'

                    ? `Conteo aplicado el ${formatoFechaConteo(conteo.fechaFin, true)}.`

                    : 'Consulta los registros de esta sesión.';
    }

    renderizarTablaDetalleConteo(
        detalles,
        enProceso
    );

    limpiarEditorVarianteConteo();
}






function renderizarTablaDetalleConteo(detalles, editable) {

    const tbody =
        document.getElementById('countDetailRows');

    const tableWrap =
        document.getElementById('countDetailTableWrap');

    if (!tbody) return;

    if (!detalles.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="subtle">
                    Aún no se han registrado variantes en este conteo.
                </td>
            </tr>
        `;

        if (tableWrap) {
            tableWrap.classList.add('count-table-empty');
        }

        return;
    }

    if (tableWrap) {
        tableWrap.classList.remove('count-table-empty');
    }

    tbody.innerHTML = detalles.map(item => {

        const delta = Number(item.diferencia) || 0;

        const deltaText = String(delta);

        const deltaClass =
            delta > 0
                ? 'count-positive'
                : delta < 0
                    ? 'count-negative'
                    : 'count-neutral';

        return `
            <tr>

                <td class="count-product-cell">

                    <strong>
                        ${escapeHTML(item.nombreProducto || 'Producto')}
                    </strong>

                    <small>
                        ${escapeHTML(item.codigoProducto || '')}
                        ·
                        ${escapeHTML(item.talla || 'Sin talla')}
                        ·
                        ${escapeHTML(item.color || 'Sin color')}
                    </small>

                    <small class="mono">
                        ${escapeHTML(item.codigoBarras || '')}
                    </small>

                </td>

                <td class="mono">
                    ${Number(item.cantidadSistema) || 0}
                </td>

                <td class="mono">
                    ${Number(item.cantidadFisica) || 0}
                </td>

                <td class="mono ${deltaClass}">
                    ${delta > 0 ? '+' : ''}${deltaText}
                </td>

                <td>
                    ${escapeHTML(item.motivo || '—')}
                </td>

                <td>

                    ${editable ? `

                        <button
                            class="icon-btn"
                            type="button"
                            title="Editar conteo"
                            aria-label="Editar conteo"
                            data-count-edit-variant="${Number(item.productoVarianteId)}"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                    ` : `

                        <span class="count-readonly">
                            <i class="fa-solid fa-lock"></i>
                        </span>

                    `}

                </td>

            </tr>
        `;

    }).join('');
}






async function buscarVariantesConteo(termino) {

    const resultados =
        document.getElementById('countVariantResults');

    if (!resultados) return;

    const texto = String(termino || '').trim();

    const peticion = ++solicitudBusquedaConteo;

    if (texto.length < 2) {

        resultados.classList.add('hidden');
        resultados.innerHTML = '';

        variantesBusquedaConteo = [];

        return;
    }

    resultados.classList.remove('hidden');

    resultados.innerHTML = `
        <div class="count-search-message">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Buscando variantes...
        </div>
    `;

    try {

        const params = new URLSearchParams({
            q: texto
        });

        const response = await fetch(
            `/api/movimientos/variantes?${params.toString()}`,
            {
                credentials: 'same-origin'
            }
        );

        const data = await respuestaConteo(
            response,
            'No fue posible buscar las variantes.'
        );

        if (peticion !== solicitudBusquedaConteo) {
            return;
        }

        variantesBusquedaConteo = Array.isArray(data)
            ? data
            : [];

        if (!variantesBusquedaConteo.length) {

            resultados.innerHTML = `
                <div class="count-search-message">
                    No encontramos variantes activas con esa búsqueda.
                </div>
            `;

            return;
        }

        const detalles =
            conteoFisicoActual?.detalles || [];

        resultados.innerHTML = variantesBusquedaConteo.map(item => {

            const registrado = detalles.find(
                detalle =>
                    Number(detalle.productoVarianteId) ===
                    Number(item.idProductoVariante)
            );

            return `

                <button
                    class="count-search-result"
                    type="button"
                    data-count-pick-variant="${Number(item.idProductoVariante)}"
                >

                    <span class="count-search-product-icon">
                        <i class="fa-solid fa-shirt"></i>
                    </span>

                    <span class="count-search-product-copy">

                        <strong>
                            ${escapeHTML(item.nombreProducto)}
                            ·
                            ${escapeHTML(item.codigoProducto)}
                        </strong>

                        <small>
                            ${escapeHTML(item.codigoBarras)}
                            · Talla ${escapeHTML(item.talla)}
                            · ${escapeHTML(item.color)}
                        </small>

                    </span>

                    <span class="count-search-stock">

                        <strong>
                            ${Number(
                registrado
                    ? registrado.cantidadSistema
                    : item.existenciaActual
            ) || 0}
                        </strong>

                        <small>
                            ${registrado
                    ? `Físico: ${Number(registrado.cantidadFisica) || 0}`
                    : 'Sistema'}
                        </small>

                    </span>

                    <span class="count-search-pick-label">
                        ${registrado ? 'Editar' : 'Contar'}
                        <i class="fa-solid fa-chevron-right"></i>
                    </span>

                </button>

            `;

        }).join('');

    } catch (error) {

        if (peticion !== solicitudBusquedaConteo) {
            return;
        }

        resultados.innerHTML = `
            <div class="count-search-message count-error-text">
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}






function seleccionarVarianteConteo(id) {

    const variante = variantesBusquedaConteo.find(
        item =>
            Number(item.idProductoVariante) === Number(id)
    );

    if (!variante || !conteoFisicoActual) return;

    const detalleExistente =
        (conteoFisicoActual.detalles || []).find(
            item =>
                Number(item.productoVarianteId) === Number(id)
        );

    varianteSeleccionadaConteo = {

        idProductoVariante: Number(id),

        nombreProducto: variante.nombreProducto,

        codigoProducto: variante.codigoProducto,

        codigoBarras: variante.codigoBarras,

        talla: variante.talla,

        color: variante.color,

        cantidadSistema: Number(
            detalleExistente
                ? detalleExistente.cantidadSistema
                : variante.existenciaActual
        ) || 0,

        cantidadFisica:
            detalleExistente?.cantidadFisica ?? '',

        motivo:
            detalleExistente?.motivo || ''
    };

    renderizarEditorVarianteConteo();
}


function seleccionarDetalleParaEditarConteo(id) {

    const detalle =
        (conteoFisicoActual?.detalles || []).find(
            item =>
                Number(item.productoVarianteId) === Number(id)
        );

    if (!detalle) return;

    varianteSeleccionadaConteo = {

        idProductoVariante: Number(detalle.productoVarianteId),

        nombreProducto: detalle.nombreProducto,

        codigoProducto: detalle.codigoProducto,

        codigoBarras: detalle.codigoBarras,

        talla: detalle.talla,

        color: detalle.color,

        cantidadSistema: Number(detalle.cantidadSistema) || 0,

        cantidadFisica: detalle.cantidadFisica,

        motivo: detalle.motivo || ''
    };

    renderizarEditorVarianteConteo();

    document.getElementById('countSelectedVariant')
        ?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
}


function renderizarEditorVarianteConteo() {

    const panel =
        document.getElementById('countSelectedVariant');

    if (!panel || !varianteSeleccionadaConteo) {
        return;
    }

    const item = varianteSeleccionadaConteo;

    document.getElementById('countSelectedName').textContent =
        item.nombreProducto || 'Producto';

    document.getElementById('countSelectedMeta').textContent =
        `${item.codigoProducto || ''} · ${item.codigoBarras || ''} · Talla ${item.talla || '—'} · ${item.color || '—'}`;

    document.getElementById('countSelectedSystem').textContent =
        String(item.cantidadSistema);

    document.getElementById('countPhysicalQuantity').value =
        item.cantidadFisica === ''
            ? ''
            : String(item.cantidadFisica);

    document.getElementById('countReason').value =
        item.motivo || '';

    document.getElementById('countPhysicalQuantity').focus();

    panel.classList.remove('hidden');
}


function limpiarEditorVarianteConteo() {

    varianteSeleccionadaConteo = null;

    document.getElementById('countSelectedVariant')
        ?.classList.add('hidden');

    const quantity =
        document.getElementById('countPhysicalQuantity');

    const reason =
        document.getElementById('countReason');

    if (quantity) quantity.value = '';
    if (reason) reason.value = '';
}





async function guardarDetalleConteoFisico() {

    if (
        guardandoDetalleConteo ||
        !conteoFisicoActual?.conteo ||
        !varianteSeleccionadaConteo
    ) {
        return;
    }

    const cantidad =
        document.getElementById('countPhysicalQuantity')?.value;

    const motivo =
        document.getElementById('countReason')?.value.trim() || '';

    const cantidadFisica = Number(cantidad);

    if (
        cantidad === '' ||
        !Number.isInteger(cantidadFisica) ||
        cantidadFisica < 0
    ) {

        showToast(
            'Cantidad inválida',
            'Ingresa una cantidad física entera igual o mayor que cero.'
        );

        return;
    }

    if (motivo.length > 1000) {

        showToast(
            'Motivo demasiado largo',
            'Usa máximo 1.000 caracteres.'
        );

        return;
    }

    const boton =
        document.querySelector('[data-count-save-detail]');

    guardandoDetalleConteo = true;

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Guardando...
        `;
    }

    try {

        const id = conteoFisicoActual.conteo.id;

        const response = await fetch(
            `/api/conteos-fisicos/${encodeURIComponent(id)}/detalles`,
            {

                method: 'PUT',

                credentials: 'same-origin',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    productoVarianteId:
                        varianteSeleccionadaConteo.idProductoVariante,

                    cantidadFisica,

                    motivo

                })
            }
        );

        conteoFisicoActual = await respuestaConteo(
            response,
            'No fue posible guardar el conteo de esta variante.'
        );

        showToast(
            'Conteo guardado',
            'La cantidad física quedó registrada.'
        );

        const search =
            document.getElementById('countVariantSearch');

        if (search) {
            search.value = '';
        }

        document.getElementById('countVariantResults')
            ?.classList.add('hidden');

        document.getElementById('countVariantResults')
            ?.replaceChildren();

        renderizarDetalleConteoFisico();

        await cargarConteosFisicos();

    } catch (error) {

        showToast(
            'No se pudo guardar',
            error.message
        );

    } finally {

        guardandoDetalleConteo = false;

        if (boton) {

            boton.disabled = false;

            boton.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                Guardar cantidad
            `;
        }
    }
}






async function finalizarConteoFisico() {

    if (!conteoFisicoActual?.conteo) return;

    const conteo = conteoFisicoActual.conteo;

    const pendientes =
        (Number(conteo.totalVariantes) || 0) -
        (Number(conteo.variantesContadas) || 0);

    if (pendientes > 0) {

        showToast(
            'Conteo incompleto',
            `Faltan ${pendientes} variantes por registrar.`
        );

        return;
    }

    const confirmar = confirm(
        '¿Enviar este conteo a aprobación? Después de enviarlo ya no podrás modificar sus cantidades.'
    );

    if (!confirmar) return;

    const boton =
        document.querySelector('[data-count-finalize]');

    if (boton) {
        boton.disabled = true;
    }

    try {

        const response = await fetch(
            `/api/conteos-fisicos/${encodeURIComponent(conteo.id)}/finalizar`,
            {

                method: 'POST',

                credentials: 'same-origin'

            }
        );

        await respuestaConteo(
            response,
            'No fue posible finalizar el conteo.'
        );

        showToast(
            'Conteo enviado',
            'La sesión quedó pendiente de aprobación.'
        );

        await cargarConteosFisicos();

        await abrirConteoFisico(conteo.id);

    } catch (error) {

        showToast(
            'No se pudo finalizar',
            error.message
        );

    } finally {

        if (boton) {
            boton.disabled = false;
        }
    }
}






async function aplicarConteoFisico(id = null) {

    const conteo = conteoFisicoActual?.conteo;

    const conteoId = id || conteo?.id;

    if (!conteoId || aplicandoConteo) {
        return;
    }

    if (!rolPuedeAplicarConteo()) {

        showToast(
            'Acceso restringido',
            'Solo AUXILIAR_INVENTARIO y ENCARGADO_SUCURSAL pueden aprobar y aplicar.'
        );

        return;
    }

    const item = conteosFisicos.find(
        registro =>
            Number(registro.id) === Number(conteoId)
    );

    const referencia =
        conteo?.referencia ||
        item?.referencia ||
        `CON-${conteoId}`;

    const confirmar = confirm(
        `¿Aprobar y aplicar los ajustes del conteo ${referencia}? Esta acción actualizará las existencias y generará movimientos AJU.`
    );

    if (!confirmar) return;

    aplicandoConteo = true;

    const boton =
        document.querySelector('[data-count-apply]');

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Aplicando...
        `;
    }

    try {

        const response = await fetch(
            `/api/conteos-fisicos/${encodeURIComponent(conteoId)}/aplicar`,
            {

                method: 'POST',

                credentials: 'same-origin'

            }
        );

        const resultado = await respuestaConteo(
            response,
            'No fue posible aplicar los ajustes.'
        );

        showToast(
            'Conteo aplicado',
            `${resultado.referencia || referencia} · Existencias actualizadas y ajustes registrados.`
        );

        await cargarConteosFisicos();

        await cargarInventario();

        await cargarHistorialMovimientos();

        if (
            conteoFisicoActual?.conteo &&
            Number(conteoFisicoActual.conteo.id) === Number(conteoId)
        ) {
            await abrirConteoFisico(conteoId);
        }

    } catch (error) {

        showToast(
            'No se pudo aplicar',
            error.message
        );


        if (
            String(error.message)
                .toLowerCase()
                .includes('cambió desde el conteo')
        ) {
            await abrirConteoFisico(conteoId);
        }

    } finally {

        aplicandoConteo = false;

        const applyButton =
            document.querySelector('[data-count-apply]');

        if (applyButton) {

            applyButton.disabled = false;

            applyButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Aprobar y aplicar ajustes
            `;
        }
    }
}






function inicializarEventosConteoFisico() {

    document.getElementById('countStatusFilter')
        ?.addEventListener(
            'change',
            renderizarTarjetasConteo
        );

    document.getElementById('countVariantSearch')
        ?.addEventListener('input', event => {

            window.clearTimeout(temporizadorBusquedaConteo);

            const termino = event.target.value.trim();

            temporizadorBusquedaConteo = window.setTimeout(
                () => buscarVariantesConteo(termino),
                280
            );
        });
}

function handleAction(action, id) {

    switch (action) {

        case 'new':
            productoEnEdicion = null;
            prepararModalNuevaPrenda();
            openModal('new-product');
            break;

        case 'edit':
            editarPrenda(id);
            break;

        case 'delete':
            eliminarPrenda(id);
            break;

        case 'movement':
            openModal('movement');
            break;

        case 'transfer':
            openModal('transfer');
            break;

        case 'barcode':
            openModal('barcode');
            break;

        case 'label':
            abrirModalEtiquetas(id);
            break;

        case 'detail-transfer':
            openModal('detail-transfer', id);
            break;

        case 'approve':
            void ejecutarAccionTransferencia(
                'aprobar',
                Number(id)
            );
            break;

        case 'reject':
            void ejecutarAccionTransferencia(
                'rechazar',
                Number(id)
            );
            break;

        case 'receive':
            void ejecutarAccionTransferencia(
                'recibir',
                Number(id)
            );
            break;

        case 'count':
            abrirNuevoConteoFisico();
            break;

        case 'open-count':
            abrirConteoFisico(Number(id));
            break;

        case 'apply-count':
            aplicarConteoFisico(Number(id));
            break;

        default:
            break;
    }
}

function prepararModalNuevaPrenda() {
    const formulario = document.querySelector(
        '[data-modal-content="new-product"]'
    );

    if (!formulario) return;

    productoEnEdicion = null;
    window.productoEnEdicion = null;

    formulario.querySelectorAll('input, textarea').forEach(campo => {
        if (campo.id === 'stock') {
            campo.value = '0';
        } else if (campo.id === 'consecutivo') {
            campo.value = '—';
        } else {
            campo.value = '';
        }
    });

    formulario.querySelectorAll('select').forEach(campo => {
        campo.selectedIndex = 0;
    });

    const talla = document.getElementById('talla');
    if (talla) {
        talla.replaceChildren(
            new Option('Primero seleccione un modelo', '')
        );
        talla.disabled = true;
    }

    if (typeof window.establecerColorProducto === 'function') {
        window.establecerColorProducto('');
    } else {
        const color = document.getElementById('color');
        if (color) color.value = '';
    }

    const colorValue = document.getElementById('colorValue');

    if (colorValue) {
        colorValue.innerHTML =
            '<span class="color-dot"></span><span>Seleccione un color</span>';
    }

    document.getElementById('codigoPreview')?.replaceChildren('————————');

    const titulo = document.getElementById('productModalTitle');

    if (titulo) {
        titulo.textContent = 'Nueva Prenda · Código 8D';
        titulo.classList.remove('is-editing');
        titulo.classList.add('is-creating');
    }

    const boton = document.querySelector('[data-save-product]');
    if (boton) boton.textContent = 'Guardar prenda';

    ['grupo', 'tipoProducto', 'modelo'].forEach(id => {
        const select = document.getElementById(id);

        if (select) {
            select.dispatchEvent(
                new Event('change', { bubbles: true })
            );
        }
    });

    ['temporada', 'talla'].forEach(id => {
        const select = document.getElementById(id);

        if (select) {
            select.dispatchEvent(
                new Event('input', { bubbles: true })
            );

            select.dispatchEvent(
                new Event('change', { bubbles: true })
            );
        }
    });
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

let inventarioProductos = [];
let productoEnEdicion = null;

async function eliminarPrenda(codigoProducto) {
    if (!codigoProducto) return;

    const confirmar = confirm(
        `¿Estás seguro de que deseas eliminar la prenda ${codigoProducto}?`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `/api/productos/${encodeURIComponent(codigoProducto)}`,
            { method: 'DELETE' }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || 'No fue posible eliminar la prenda.');
        }

        showToast('Prenda eliminada', `Código: ${codigoProducto}`);
        await cargarInventario();

    } catch (error) {
        console.error('Error al eliminar la prenda:', error);
        showToast('Error al eliminar', error.message);
    }
}

function esperarOpcionSelect(select, valor, tiempoMaximo = 5000) {
    if (!select || valor == null || valor === '') {
        return Promise.resolve(false);
    }

    const existe = () =>
        Array.from(select.options).some(
            opcion => opcion.value === String(valor)
        );

    if (existe()) return Promise.resolve(true);

    return new Promise(resolve => {
        let terminado = false;
        let temporizador;

        const observer = new MutationObserver(() => {
            if (existe()) finalizar(true);
        });

        function finalizar(resultado) {
            if (terminado) return;

            terminado = true;
            observer.disconnect();
            clearTimeout(temporizador);
            resolve(resultado);
        }

        observer.observe(select, {
            childList: true,
            subtree: true
        });

        temporizador = setTimeout(
            () => finalizar(existe()),
            tiempoMaximo
        );
    });
}

async function editarPrenda(codigoProducto) {
    try {
        const respuesta = await fetch(
            `/api/productos/${encodeURIComponent(codigoProducto)}/edicion`
        );

        if (!respuesta.ok) {
            throw new Error('No fue posible consultar los datos de la prenda.');
        }

        const producto = await respuesta.json();

        const grupo = document.getElementById('grupo');
        const tipo = document.getElementById('tipoProducto');
        const modelo = document.getElementById('modelo');
        const temporada = document.getElementById('temporada');
        const talla = document.getElementById('talla');
        const consecutivo = document.getElementById('consecutivo');
        const codigoPreview = document.getElementById('codigoPreview');



        productoEnEdicion = producto.codigoProducto || codigoProducto;
        window.productoEnEdicion = productoEnEdicion;


        document.getElementById('nombreProducto').value =
            producto.nombre ?? '';

        document.getElementById('descripcionProducto').value =
            producto.descripcion ?? '';

        document.getElementById('precioProducto').value =
            producto.precio ?? '';

        document.getElementById('stock').value =
            producto.stock ?? 0;


        if (grupo) {
            await esperarOpcionSelect(grupo, producto.codigoGrupo);
            grupo.value = producto.codigoGrupo ?? '';
            grupo.dispatchEvent(new Event('change', { bubbles: true }));
        }


        if (tipo) {
            await esperarOpcionSelect(tipo, producto.codigoTipoProducto);
            tipo.value = producto.codigoTipoProducto ?? '';
            tipo.dispatchEvent(new Event('change', { bubbles: true }));
        }


        if (modelo) {
            await esperarOpcionSelect(modelo, producto.codigoModelo);
            modelo.value = producto.codigoModelo ?? '';
            modelo.dispatchEvent(new Event('change', { bubbles: true }));
        }


        if (temporada) {
            const temporadaGuardada = String(producto.idTemporada ?? '');

            if (temporadaGuardada) {
                const opcionDisponible = await esperarOpcionSelect(
                    temporada,
                    temporadaGuardada
                );

                if (opcionDisponible) {
                    temporada.value = temporadaGuardada;


                    temporada.dispatchEvent(
                        new Event('input', { bubbles: true })
                    );

                    temporada.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );
                } else {
                    console.warn(
                        'No se encontró la temporada con ID:',
                        temporadaGuardada
                    );
                }
            } else {
                temporada.value = '';

                temporada.dispatchEvent(
                    new Event('change', { bubbles: true })
                );
            }
        }


        if (talla) {
            const tallaGuardada = String(producto.talla ?? '').trim();

            if (typeof window.actualizarTallasProducto === 'function') {
                window.actualizarTallasProducto(tallaGuardada);
            } else {
                talla.value = tallaGuardada;
            }

            talla.disabled = false;
        }


        if (typeof window.establecerColorProducto === 'function') {
            window.establecerColorProducto(producto.color ?? '');
        } else {
            const color = document.getElementById('color');
            if (color) color.value = producto.color ?? '';
        }


        if (consecutivo) {
            consecutivo.value = producto.codigoProducto
                ? producto.codigoProducto.slice(-2)
                : '';
        }

        if (codigoPreview) {
            codigoPreview.textContent =
                producto.codigoProducto ?? '————————';
        }

        const titulo = document.getElementById('productModalTitle');

        if (titulo) {
            titulo.textContent = `Editar prenda · ${producto.codigoProducto}`;
            titulo.classList.remove('is-creating');
            titulo.classList.add('is-editing');
        }

        const boton = document.querySelector('[data-save-product]');
        if (boton) boton.textContent = 'Actualizar prenda';

        openModal('new-product');

    } catch (error) {
        productoEnEdicion = null;
        window.productoEnEdicion = null;

        console.error('Error al editar la prenda:', error);
        showToast('Error al editar', error.message);
    }
}

function cargarOpcionesInventario() {
    const filtroTalla = document.getElementById('sizeFilter');

    if (!filtroTalla) return;

    const tallaSeleccionada = filtroTalla.value;

    const tallas = obtenerTallasCatalogo();

    filtroTalla.replaceChildren(
        new Option('Todas las tallas', '')
    );

    tallas.forEach(talla => {
        filtroTalla.add(new Option(talla, talla));
    });

    if (tallas.includes(tallaSeleccionada)) {
        filtroTalla.value = tallaSeleccionada;
    }
}

function renderizarInventario() {
    const filas = document.getElementById('inventoryRows');

    filas.innerHTML = inventarioProductos.map(producto => {
        const codigo = escapeHTML(producto.codigoProducto);
        const nombre = escapeHTML(producto.nombre);
        const grupo = escapeHTML(producto.grupo);
        const tipo = escapeHTML(producto.tipo);
        const talla = escapeHTML(producto.talla || 'Sin talla');
        const color = escapeHTML(producto.color || 'Sin color');
        const stock = Number(producto.stock) || 0;
        const temporada = escapeHTML(producto.temporada || 'Sin temporada');
        const estadoStock = stock <= 6 ? 'low' : 'good';
        const precioNumero =
            producto.precio == null || producto.precio === ''
                ? null
                : Number(producto.precio);

        const precioFormateado =
            precioNumero !== null && Number.isFinite(precioNumero)
                ? `$ ${precioNumero.toLocaleString('es-CO', {
                    maximumFractionDigits: 0
                })}`
                : 'Precio no disponible';

        return `
            <tr data-grupo="${grupo}" data-tipo="${tipo}" data-talla="${talla}">
                <td class="mono">${codigo}</td>
                <td>
                    <div class="product-name">${nombre}</div>
                    <div class="product-meta">${grupo} · ${tipo}</div>
                </td>
                <td>
                    ${talla}
                    <div class="product-meta">${color}</div>
                </td>
                <td>
                    <span class="qty ${estadoStock}">${stock}</span>
                </td>
               <td class="mono">${precioFormateado}</td>
                <td>${temporada}</td>
                <td>
                    <div class="actions">
                        <button
                            class="icon-btn"
                            type="button"
                            data-action="edit"
                            data-id="${codigo}"
                            aria-label="Editar ${nombre}">
                            <i class="fa-solid fa-marker"></i>
                        </button>
                        <button
                            class="icon-btn"
                            type="button"
                            data-action="label"
                            data-id="${codigo}"
                            aria-label="Etiquetas ${nombre}">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button
                            class="icon-btn"
                            type="button"
                            data-action="delete"
                            data-id="${codigo}"
                            aria-label="Eliminar ${nombre}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (inventarioProductos.length === 0) {
        filas.innerHTML = `
            <tr>
                <td colspan="7">No hay prendas registradas en el inventario.</td>
            </tr>
        `;
    }

    filterInventory();
}

async function cargarInventario() {
    const filas = document.getElementById('inventoryRows');

    try {
        const respuesta = await fetch('/api/productos/inventario');

        if (!respuesta.ok) {
            throw new Error('No fue posible consultar el inventario.');
        }

        inventarioProductos = await respuesta.json();

        cargarOpcionesInventario();
        renderizarInventario();
    } catch (error) {
        console.error('Error al cargar el inventario:', error);

        filas.innerHTML = `
            <tr>
                <td colspan="7">No fue posible cargar el inventario. Intenta nuevamente.</td>
            </tr>
        `;
    }
}

function filterInventory() {
    const query = document
        .getElementById("inventorySearch")
        .value.trim().toLocaleLowerCase("es");

    const talla = document
        .getElementById("sizeFilter")
        .value.trim();

    const grupo = document
        .getElementById("groupFilter")
        .value.trim();

    const tipo = document
        .getElementById("typeFilter")
        .value.trim();

    document.querySelectorAll("#inventoryRows tr").forEach(row => {

        if (row.cells.length < 7) return;

        const texto = row.textContent.toLocaleLowerCase("es");

        const coincideBusqueda =
            !query || texto.includes(query);

        const coincideTalla =
            !talla || row.dataset.talla === talla;

        const coincideGrupo =
            !grupo || row.dataset.grupo === grupo;

        const coincideTipo =
            !tipo || row.dataset.tipo === tipo;

        const mostrar =
            coincideBusqueda &&
            coincideTalla &&
            coincideGrupo &&
            coincideTipo;

        row.classList.toggle("hidden", !mostrar);
    });
}

async function cargarHistorialMovimientos() {

    const tbody = document.getElementById('movementRows');

    if (!tbody) return;

    try {

        const response = await fetch(
            '/api/movimientos/historial'
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error(
                'No fue posible consultar el historial de movimientos.'
            );
        }

        if (!data.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="subtle">
                        Todavía no hay movimientos registrados.
                    </td>
                </tr>
            `;

            return;
        }

        const formatter = new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const etiquetas = {
            ENT: 'Entrada',
            SAL: 'Salida',
            AJU: 'Ajuste',
            DEV: 'Devolución'
        };

        tbody.innerHTML = data.map(item => {

            const codigo = String(
                item.codigoTipo || ''
            ).toUpperCase();

            const fecha = item.fecha
                ? formatter.format(new Date(item.fecha))
                : '—';

            const motivo = [
                item.referencia,
                item.observacion
            ].filter(Boolean).join(' · ') || 'Sin observaciones';

            return `

                <tr
                data-movement-type="${escapeHTML(codigo)}"
                data-movement-date="${escapeHTML(item.fecha || '')}">

                    <td>
                        ${escapeHTML(fecha)}
                    </td>

                    <td>
                        <span class="pill movement-history-pill movement-pill-${escapeHTML(codigo.toLowerCase())}">
                            ${escapeHTML(etiquetas[codigo] || item.nombreTipo || codigo)}
                            · ${escapeHTML(codigo)}
                        </span>
                    </td>

                    <td>
                        <b>
                            ${escapeHTML(item.detalleProductos || 'Sin detalle')}
                        </b>

                        <div class="product-meta mono">
                            Movimiento #${escapeHTML(item.idMovimiento)}
                        </div>
                    </td>

                    <td>
                        ${escapeHTML(item.sucursal || '—')}
                    </td>

                    <td class="qty">
                        ${Number(item.unidadesAfectadas) || 0} unid.
                    </td>

                    <td>
                        ${escapeHTML(item.usuario || '—')}
                    </td>

                    <td class="subtle">
                        ${escapeHTML(motivo)}
                    </td>

                </tr>
            `;

        }).join('');

        filterMovements();

    } catch (error) {

        console.error(
            'Error al cargar el historial:',
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="subtle">
                    No fue posible cargar los movimientos.
                    Intenta nuevamente.
                </td>
            </tr>
        `;
    }
}

function filterMovements() {

    const query = document
        .getElementById('movementSearch')
        .value
        .trim()
        .toLocaleLowerCase('es');

    const type = document
        .getElementById('movementTypeFilter')
        .value;

    const dateFilter = document
        .getElementById('movementDateFilter')
        .value;


    const ahora = new Date();

    let fechaDesde = null;

    let fechaHasta = null;






    if (dateFilter === '30') {

        fechaDesde = new Date(
            ahora.getTime() - (30 * 24 * 60 * 60 * 1000)
        );

        fechaHasta = ahora;

    }






    else if (dateFilter === 'today') {

        fechaDesde = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
        );

        fechaHasta = new Date(
            fechaDesde
        );

        fechaHasta.setDate(
            fechaHasta.getDate() + 1
        );

    }






    else if (dateFilter === 'week') {

        fechaDesde = new Date(ahora);

        const diferencia = (
            ahora.getDay() + 6
        ) % 7;

        fechaDesde.setDate(
            ahora.getDate() - diferencia
        );

        fechaDesde.setHours(0, 0, 0, 0);

        fechaHasta = ahora;

    }


    document.querySelectorAll('#movementRows tr').forEach(row => {

        const texto = row.textContent
            .toLocaleLowerCase('es');

        const movementType = row.dataset.movementType || '';

        const fechaMovimiento = row.dataset.movementDate
            ? new Date(row.dataset.movementDate)
            : null;


        const matchesQuery =
            !query || texto.includes(query);


        const matchesType =
            !type || movementType === type;


        const fechaValida =
            fechaMovimiento &&
            !Number.isNaN(fechaMovimiento.getTime());


        let matchesDate = true;

        if (dateFilter) {

            matchesDate = Boolean(
                fechaValida &&
                fechaMovimiento >= fechaDesde &&
                fechaMovimiento <= fechaHasta
            );

        }


        const mostrar =
            matchesQuery &&
            matchesType &&
            matchesDate;

        row.classList.toggle(
            'hidden',
            !mostrar
        );

    });

}

function filterCards(selectId, cardSelector, dataAttribute) {
    const selected = document.getElementById(selectId).value;
    document.querySelectorAll(cardSelector).forEach((card) => {
        card.classList.toggle('hidden', Boolean(selected) && card.dataset[dataAttribute] !== selected);
    });
}









async function transferenciaFetch(url, options = {}) {

    const response = await fetch(url, {

        ...options,

        headers: {

            ...(options.body
                ? { 'Content-Type': 'application/json' }
                : {}),

            ...(options.headers || {})

        }

    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {

        throw new Error(

            data.mensaje ||
            data.detail ||
            data.message ||

            'No fue posible completar la operación de transferencia.'

        );

    }

    return data;
}





async function actualizarBadgeTransferencias() {

    const badge = document.getElementById(
        'transferNotificationBadge'
    );

    if (!badge) return;

    try {

        const respuesta = await transferenciaFetch(
            '/api/transferencias/pendientes/contador'
        );

        const cantidad = Math.max(
            0,
            Number(respuesta.cantidad) || 0
        );


        badge.textContent = cantidad > 99
            ? '99+'
            : String(cantidad);


        badge.classList.toggle(
            'hidden',
            cantidad === 0
        );


        badge.setAttribute(
            'aria-label',
            cantidad === 1
                ? '1 transferencia pendiente de atención'
                : `${cantidad} transferencias pendientes de atención`
        );

        badge.title = cantidad === 0
            ? 'No tienes transferencias pendientes'
            : `${cantidad} transferencias requieren tu atención`;

    } catch (error) {

        console.error(
            'No fue posible actualizar las notificaciones de transferencias:',
            error
        );


        badge.classList.add('hidden');

    }

}





function fechaTransferencia(fecha) {

    if (!fecha) {
        return 'Fecha no disponible';
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-CO', {

        day: '2-digit',

        month: 'short',

        year: 'numeric',

        hour: '2-digit',

        minute: '2-digit'

    }).format(date);
}






function etiquetaEstadoTransferencia(estado) {

    const configuracion = {

        'SOLICITADA': {
            clase: 'solicitada',
            texto: 'Solicitada'
        },

        'EN TRANSITO': {
            clase: 'transito',
            texto: 'En tránsito'
        },

        'RECIBIDA': {
            clase: 'recibida',
            texto: 'Recibida'
        },

        'RECHAZADA': {
            clase: 'rechazada',
            texto: 'Rechazada'
        }

    };

    return configuracion[estado] || {

        clase: 'solicitada',

        texto: estado || 'Sin estado'

    };
}






async function cargarTransferencias() {

    const container = document.getElementById('transferCards');

    if (!container) return;

    container.innerHTML = `

        <div class="transfer-empty">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <strong>Cargando transferencias...</strong>

            <span>
                Consultando las solicitudes de tu sucursal.
            </span>

        </div>

    `;

    try {

        if (!transferContext) {

            transferContext = await transferenciaFetch(
                '/api/transferencias/contexto'
            );

        }

        transferenciasActuales = await transferenciaFetch(
            '/api/transferencias'
        );

        renderizarTransferencias();
        void actualizarBadgeTransferencias();

    } catch (error) {

        console.error(
            'Error cargando transferencias:',
            error
        );

        container.innerHTML = `

            <div class="transfer-empty transfer-empty-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    No fue posible cargar las transferencias
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

                <button
                    class="btn"
                    type="button"
                    data-reload-transfers
                >

                    <i class="fa-solid fa-rotate-right"></i>

                    Reintentar

                </button>

            </div>

        `;

        actualizarResumenTransferencias([]);

    }
}






function actualizarResumenTransferencias(registros) {

    const estados = registros.map(item => item.estado);

    document.getElementById('transferStatTotal').textContent =
        registros.length;

    document.getElementById('transferStatPending').textContent =

        estados.filter(
            estado => estado === 'SOLICITADA'
        ).length;

    document.getElementById('transferStatTransit').textContent =

        estados.filter(
            estado => estado === 'EN TRANSITO'
        ).length;

    document.getElementById('transferStatReceived').textContent =

        estados.filter(
            estado => estado === 'RECIBIDA'
        ).length;

}






function renderizarTransferencias() {

    const container = document.getElementById('transferCards');

    if (!container) return;

    actualizarResumenTransferencias(transferenciasActuales);

    if (!transferenciasActuales.length) {

        container.innerHTML = `

            <div class="transfer-empty">

                <span class="transfer-empty-icon">

                    <i class="fa-solid fa-right-left"></i>

                </span>

                <strong>
                    Aún no hay transferencias
                </strong>

                <span>
                    Cuando tu sucursal solicite o envíe mercancía,
                    las operaciones aparecerán aquí.
                </span>

                <button
                    class="btn btn-red"
                    type="button"
                    data-action="transfer"
                >

                    <i class="fa-solid fa-plus"></i>

                    Crear primera solicitud

                </button>

            </div>

        `;

        return;
    }

    container.innerHTML = transferenciasActuales.map(transferencia => {

        const estado = etiquetaEstadoTransferencia(
            transferencia.estado
        );

        const lineas = transferencia.detalles || [];

        const unidades = lineas.reduce((total, linea) => {

            return total + Number(

                transferencia.estado === 'SOLICITADA'

                    ? linea.cantidadSolicitada

                    : linea.cantidadAprobada
                    || linea.cantidadSolicitada
                    || 0

            );

        }, 0);


        const esDestino =

            Number(transferencia.sucursalDestinoId) ===

            Number(transferContext?.sucursalActualId);


        const relacion = esDestino

            ? 'Solicitud para mi sucursal'

            : 'Solicitud de mi sucursal';


        const preview = lineas.slice(0, 2).map(linea => `

            <div class="transfer-product-preview">

                <span class="transfer-product-dot"></span>

                <span>
                    ${escapeHTML(linea.nombreProducto)}
                    · ${escapeHTML(linea.talla)}
                    / ${escapeHTML(linea.color)}
                </span>

                <b>
                    ${Number(linea.cantidadSolicitada) || 0} un.
                </b>

            </div>

        `).join('');


        const restantes = lineas.length > 2

            ? `
                <small class="transfer-more-lines">
                    + ${lineas.length - 2} referencia(s) adicional(es)
                </small>
            `

            : '';



        let acciones = `

            <button
                class="btn transfer-secondary-action"
                type="button"
                data-action="detail-transfer"
                data-id="${transferencia.idTransferencia}"
            >

                <i class="fa-regular fa-eye"></i>

                Ver detalle

            </button>

        `;


        if (transferencia.puedeAprobar) {

            acciones += `

                <button
                    class="btn btn-red"
                    type="button"
                    data-action="approve"
                    data-id="${transferencia.idTransferencia}"
                >

                    <i class="fa-solid fa-check"></i>

                    Aprobar y despachar

                </button>

            `;

        } else if (transferencia.puedeRecibir) {

            acciones += `

                <button
                    class="btn btn-red"
                    type="button"
                    data-action="receive"
                    data-id="${transferencia.idTransferencia}"
                >

                    <i class="fa-solid fa-box-open"></i>

                    Confirmar recepción

                </button>

            `;

        }


        return `

            <article
                class="transfer-card"
                data-transfer-status="${escapeHTML(transferencia.estado)}"
                data-transfer-search="${escapeHTML([

            transferencia.referencia,

            transferencia.sucursalOrigen,

            transferencia.sucursalDestino,

            transferencia.usuarioSolicitante,

            transferencia.observacion,

            ...lineas.map(linea => `

                        ${linea.nombreProducto}

                        ${linea.codigoProducto}

                        ${linea.codigoBarras}

                        ${linea.talla}

                        ${linea.color}

                    `)

        ].join(' ').toLocaleLowerCase('es'))}"
            >

                <div class="transfer-card-head">

                    <div>

                        <span class="transfer-reference">

                            ${escapeHTML(transferencia.referencia)}

                        </span>

                        <small>

                            ${fechaTransferencia(transferencia.fechaSolicitud)}

                        </small>

                    </div>


                    <span class="transfer-status ${estado.clase}">

                        <span></span>

                        ${estado.texto}

                    </span>

                </div>


                <div class="transfer-card-body">

                    <div class="transfer-relation-label">

                        <i class="fa-solid fa-building"></i>

                        ${relacion}

                    </div>


                    <div class="transfer-route-display">

                        <div class="transfer-route-stop">

                            <span class="transfer-route-node"></span>

                            <small>ORIGEN</small>

                            <strong>
                                ${escapeHTML(transferencia.sucursalOrigen)}
                            </strong>

                            <span>
                                ${escapeHTML(transferencia.ciudadOrigen || '')}
                            </span>

                        </div>


                        <div class="transfer-route-connector">

                            <i class="fa-solid fa-arrow-right-long"></i>

                        </div>


                        <div class="transfer-route-stop">

                            <span class="transfer-route-node destination"></span>

                            <small>DESTINO</small>

                            <strong>
                                ${escapeHTML(transferencia.sucursalDestino)}
                            </strong>

                            <span>
                                ${escapeHTML(transferencia.ciudadDestino || '')}
                            </span>

                        </div>

                    </div>


                    <div class="transfer-card-products">

                        <div class="transfer-card-products-head">

                            <span>DETALLE DE PRENDAS</span>

                            <b>
                                ${lineas.length} referencia(s) · ${unidades} unidades
                            </b>

                        </div>

                        ${preview || '<span class="subtle">Sin prendas registradas</span>'}

                        ${restantes}

                    </div>

                </div>


                <div class="transfer-card-foot">

                    <span class="transfer-requester">

                        <i class="fa-regular fa-user"></i>

                        ${escapeHTML(transferencia.usuarioSolicitante || 'Usuario')}

                    </span>


                    <div class="transfer-card-actions">

                        ${acciones}

                    </div>

                </div>

            </article>

        `;

    }).join('');

    filtrarTransferencias();
}






function filtrarTransferencias() {

    const query = (

        document.getElementById('transferSearch')?.value || ''

    ).trim().toLocaleLowerCase('es');


    const estado =

        document.getElementById('transferStatusFilter')?.value || '';


    document.querySelectorAll(
        '#transferCards .transfer-card'
    ).forEach(card => {

        const coincideTexto =

            !query ||

            (card.dataset.transferSearch || '').includes(query);


        const coincideEstado =

            !estado ||

            card.dataset.transferStatus === estado;


        card.classList.toggle(
            'hidden',
            !(coincideTexto && coincideEstado)
        );

    });


    const visibles = [

        ...document.querySelectorAll(
            '#transferCards .transfer-card'
        )

    ].filter(card => !card.classList.contains('hidden'));


    let empty = document.getElementById('transferFilterEmpty');


    if (!visibles.length && transferenciasActuales.length) {

        if (!empty) {

            empty = document.createElement('div');

            empty.id = 'transferFilterEmpty';

            empty.className =
                'transfer-empty transfer-filter-empty';

            empty.innerHTML = `

                <i class="fa-solid fa-filter-circle-xmark"></i>

                <strong>
                    No encontramos coincidencias
                </strong>

                <span>
                    Prueba con otro término o cambia el filtro de estado.
                </span>

            `;

            document.getElementById('transferCards')
                .appendChild(empty);

        }

        empty.classList.remove('hidden');

    } else if (empty) {

        empty.classList.add('hidden');

    }

}






async function prepararModalTransferencia() {

    const selectOrigen =
        document.getElementById('transferOriginStore');

    const destino =
        document.getElementById('transferDestinationStore');

    const search =
        document.getElementById('transferVariantSearch');

    const results =
        document.getElementById('transferVariantResults');

    const observation =
        document.getElementById('transferObservation');

    const saveButton =
        document.querySelector('[data-save-transfer]');


    transferDraft = {
        sucursalOrigenId: '',
        detalles: []
    };

    transferSearchResults = [];

    window.clearTimeout(transferSearchTimer);

    transferSearchRequest++;


    if (selectOrigen) {

        selectOrigen.replaceChildren(
            new Option('Cargando sucursales...', '')
        );

        selectOrigen.disabled = true;

    }


    if (destino) {

        destino.textContent =
            'Consultando tu sucursal...';

    }


    if (search) {

        search.value = '';

        search.disabled = true;

        search.placeholder =
            'Primero selecciona una sucursal de origen...';

    }


    if (results) {

        results.replaceChildren();

        results.classList.add('hidden');

    }


    if (observation) {
        observation.value = '';
    }

    if (saveButton) {
        saveButton.disabled = true;
    }

    renderizarLineasTransferencia();


    try {

        transferContext = await transferenciaFetch(
            '/api/transferencias/contexto'
        );


        if (destino) {

            destino.textContent =

                `${transferContext.sucursalActualNombre}
                · ${transferContext.sucursalActualCiudad}`;

        }


        if (selectOrigen) {

            selectOrigen.replaceChildren(

                new Option(
                    'Selecciona la sucursal que despachará',
                    ''
                )

            );

            (transferContext.sucursalesOrigen || [])
                .forEach(sucursal => {

                    selectOrigen.add(

                        new Option(

                            `${sucursal.nombre} · ${sucursal.ciudad}`,

                            String(sucursal.idSucursal)

                        )

                    );

                });

            selectOrigen.disabled = false;

            selectOrigen.dispatchEvent(

                new Event('change', {
                    bubbles: true
                })

            );

        }


        if (!transferContext.sucursalesOrigen?.length) {

            showToast(
                'Sin sucursales disponibles',
                'No hay otra sucursal activa para solicitar mercancía.'
            );

        }

    } catch (error) {

        console.error(
            'Error preparando transferencia:',
            error
        );

        if (destino) {

            destino.textContent =
                'No fue posible consultar tu sucursal';

        }

        if (selectOrigen) {

            selectOrigen.replaceChildren(

                new Option(
                    'No fue posible cargar sucursales',
                    ''
                )

            );

            selectOrigen.disabled = true;

        }

        showToast(
            'No se pudo preparar la transferencia',
            error.message
        );

    }

}






function cambiarSucursalOrigenTransferencia(event) {

    const select =

        event?.target ||

        document.getElementById('transferOriginStore');


    if (!select) return;


    transferDraft.sucursalOrigenId = select.value;


    transferDraft.detalles = [];

    transferSearchResults = [];

    transferSearchRequest++;

    window.clearTimeout(transferSearchTimer);


    const search =
        document.getElementById('transferVariantSearch');

    const results =
        document.getElementById('transferVariantResults');


    if (search) {

        search.value = '';

        search.disabled = !select.value;

        search.placeholder = select.value

            ? 'Busca por nombre, código de producto, talla o color...'

            : 'Primero selecciona una sucursal de origen...';

    }


    if (results) {

        results.replaceChildren();

        results.classList.add('hidden');

    }


    renderizarLineasTransferencia();

}






async function buscarVariantesTransferencia(termino) {

    const results =
        document.getElementById('transferVariantResults');

    const origenId =
        Number(transferDraft.sucursalOrigenId);


    if (!results || !origenId || termino.trim().length < 2) {
        return;
    }


    const requestId = ++transferSearchRequest;


    results.innerHTML = `

        <div class="transfer-search-state">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Buscando prendas disponibles...

        </div>

    `;

    results.classList.remove('hidden');


    try {

        const params = new URLSearchParams({

            sucursalOrigenId: String(origenId),

            q: termino.trim()

        });


        const data = await transferenciaFetch(

            `/api/transferencias/variantes?${params}`

        );


        if (requestId !== transferSearchRequest) {
            return;
        }


        transferSearchResults =
            Array.isArray(data) ? data : [];


        if (!transferSearchResults.length) {

            results.innerHTML = `

                <div class="transfer-search-state">

                    <i class="fa-solid fa-box-open"></i>

                    No encontramos prendas con existencias en esa sucursal.

                </div>

            `;

            return;
        }


        results.innerHTML = transferSearchResults.map(item => {

            const agregada = transferDraft.detalles.some(

                linea => linea.idProductoVariante ===
                    Number(item.idProductoVariante)

            );


            return `

                <button
                    class="transfer-variant-option"
                    type="button"
                    data-add-transfer-variant="${Number(item.idProductoVariante)}"
                    ${agregada ? 'disabled' : ''}
                >

                    <span class="transfer-variant-icon">

                        <i class="fa-solid fa-shirt"></i>

                    </span>


                    <span class="transfer-variant-copy">

                        <strong>
                            ${escapeHTML(item.nombreProducto)}
                        </strong>

                        <small>

                            ${escapeHTML(item.codigoProducto)}

                            · ${escapeHTML(item.codigoBarras)}

                            · Talla ${escapeHTML(item.talla)}

                            · ${escapeHTML(item.color)}

                        </small>

                    </span>


                    <span class="transfer-variant-availability">

                        <b>
                            ${Number(item.existenciaDisponible) || 0}
                        </b>

                        <small>
                            ${agregada ? 'Agregada' : 'Disponibles'}
                        </small>

                    </span>


                    <i class="fa-solid ${agregada ? 'fa-circle-check' : 'fa-plus'
                } transfer-variant-add-icon"></i>

                </button>

            `;

        }).join('');

    } catch (error) {

        if (requestId !== transferSearchRequest) {
            return;
        }

        results.innerHTML = `

            <div class="transfer-search-state transfer-search-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                ${escapeHTML(error.message)}

            </div>

        `;

    }

}






function agregarVarianteTransferencia(idVariante) {

    const variante = transferSearchResults.find(

        item => Number(item.idProductoVariante) === idVariante

    );

    if (!variante) return;


    const existe = transferDraft.detalles.some(

        item => item.idProductoVariante === idVariante

    );

    if (existe) return;


    transferDraft.detalles.push({

        ...variante,

        idProductoVariante: idVariante,

        cantidad: 1

    });


    const search =
        document.getElementById('transferVariantSearch');

    const results =
        document.getElementById('transferVariantResults');


    if (search) {
        search.value = '';
    }

    if (results) {

        results.replaceChildren();

        results.classList.add('hidden');

    }


    transferSearchResults = [];

    transferSearchRequest++;


    renderizarLineasTransferencia();

    search?.focus();

}






function renderizarLineasTransferencia() {

    const container =
        document.getElementById('transferSelectedLines');

    if (!container) return;


    if (!transferDraft.detalles.length) {

        container.innerHTML = `

            <div class="transfer-lines-empty">

                <i class="fa-solid fa-box-open"></i>

                <strong>
                    Aún no has agregado prendas
                </strong>

                <span>
                    Las variantes seleccionadas aparecerán aquí.
                </span>

            </div>

        `;

    } else {

        container.innerHTML = transferDraft.detalles.map(item => `

            <div class="transfer-line">

                <span class="transfer-line-product-icon">

                    <i class="fa-solid fa-shirt"></i>

                </span>


                <span class="transfer-line-description">

                    <strong>
                        ${escapeHTML(item.nombreProducto)}
                    </strong>

                    <small>

                        ${escapeHTML(item.codigoProducto)}

                        · ${escapeHTML(item.talla)}

                        / ${escapeHTML(item.color)}

                        · Código ${escapeHTML(item.codigoBarras)}

                    </small>

                </span>


                <span class="transfer-line-stock">

                    <small>DISPONIBLE</small>

                    <b>
                        ${Number(item.existenciaDisponible) || 0}
                    </b>

                </span>


                <label class="transfer-quantity-control">

                    <small>CANT.</small>

                    <input
                        type="number"
                        min="1"
                        max="${Number(item.existenciaDisponible)}"
                        value="${Number(item.cantidad)}"
                        data-transfer-quantity="${Number(item.idProductoVariante)}"
                        aria-label="Cantidad a solicitar de ${escapeHTML(item.nombreProducto)}"
                    />

                </label>


                <button
                    class="icon-btn transfer-remove-line"
                    type="button"
                    data-remove-transfer-variant="${Number(item.idProductoVariante)}"
                    aria-label="Quitar ${escapeHTML(item.nombreProducto)}"
                    title="Quitar prenda"
                >

                    <i class="fa-solid fa-trash-can"></i>

                </button>

            </div>

        `).join('');

    }


    actualizarResumenTransferencia();

}






function actualizarResumenTransferencia() {

    const lineas = transferDraft.detalles.length;

    const unidades = transferDraft.detalles.reduce(

        (total, item) => total + Number(item.cantidad || 0),

        0

    );


    const count =
        document.getElementById('transferSelectionCount');

    const unitsLabel =
        document.getElementById('transferUnitsLabel');

    const summary =
        document.getElementById('transferSummaryUnits');

    const saveButton =
        document.querySelector('[data-save-transfer]');


    if (count) {

        count.textContent =

            `${lineas} ${lineas === 1 ? 'prenda' : 'prendas'}`;

    }

    if (unitsLabel) {

        unitsLabel.textContent =

            `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'}`;

    }

    if (summary) {

        summary.textContent = String(unidades);

    }

    if (saveButton) {

        saveButton.disabled =

            transferSaving ||

            lineas === 0 ||

            !transferDraft.sucursalOrigenId;

    }

}






async function guardarTransferencia() {

    if (transferSaving) return;


    const boton =
        document.querySelector('[data-save-transfer]');


    const origenId = Number(

        document.getElementById('transferOriginStore')?.value

    );


    const observacion =

        document.getElementById('transferObservation')
            ?.value.trim() || '';


    if (!origenId) {

        showToast(
            'Sucursal requerida',
            'Selecciona la sucursal que despachará las prendas.'
        );

        return;

    }


    if (!transferDraft.detalles.length) {

        showToast(
            'Agrega prendas',
            'Debes agregar al menos una variante a la solicitud.'
        );

        return;

    }


    const detalles = transferDraft.detalles.map(item => ({

        productoVarianteId:
            Number(item.idProductoVariante),

        cantidadSolicitada:
            Number(item.cantidad)

    }));


    const cantidadInvalida = transferDraft.detalles.some(item =>

        !Number.isInteger(Number(item.cantidad)) ||

        Number(item.cantidad) < 1 ||

        Number(item.cantidad) > Number(item.existenciaDisponible)

    );


    if (cantidadInvalida) {

        showToast(
            'Cantidad no válida',
            'Verifica que las cantidades sean mayores que cero y no superen las existencias de origen.'
        );

        return;

    }


    transferSaving = true;

    if (boton) {

        boton.disabled = true;

        boton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Enviando solicitud...

        `;

    }


    try {

        const respuesta = await transferenciaFetch(

            '/api/transferencias/solicitar',

            {

                method: 'POST',

                body: JSON.stringify({

                    sucursalOrigenId: origenId,

                    observacion,

                    detalles

                })

            }

        );


        closeModal();


        showToast(

            'Solicitud registrada',

            `Se creó ${respuesta.referencia}.
             La sucursal de origen debe aprobarla.`

        );


        await cargarTransferencias();


    } catch (error) {

        console.error(
            'Error solicitando transferencia:',
            error
        );

        showToast(
            'No se pudo solicitar',
            error.message
        );

    } finally {

        transferSaving = false;

        if (boton) {

            boton.innerHTML = `

                <i class="fa-solid fa-paper-plane"></i>

                Enviar solicitud

            `;

            boton.disabled =
                transferDraft.detalles.length === 0;

        }

    }

}






async function cargarDetalleTransferencia(id) {

    const content =
        document.getElementById('transferDetailContent');

    const actions =
        document.getElementById('transferDetailActions');


    if (!content || !actions || !id) return;


    content.innerHTML = `

        <div class="transfer-empty">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <strong>Cargando detalle...</strong>

        </div>

    `;


    actions.innerHTML = `

        <button class="btn" type="button" data-close>
            Cerrar
        </button>

    `;


    try {

        const item = await transferenciaFetch(

            `/api/transferencias/${id}`

        );


        const estado =
            etiquetaEstadoTransferencia(item.estado);

        const detalles = item.detalles || [];


        const unidadesSolicitadas = detalles.reduce(

            (sum, line) =>
                sum + Number(line.cantidadSolicitada || 0),

            0

        );


        const unidadesAprobadas = detalles.reduce(

            (sum, line) =>
                sum + Number(line.cantidadAprobada || 0),

            0

        );


        content.innerHTML = `

            <div class="transfer-detail-overview">

                <div>

                    <span class="transfer-reference">

                        ${escapeHTML(item.referencia)}

                    </span>

                    <small>

                        Creada el ${fechaTransferencia(item.fechaSolicitud)}

                    </small>

                </div>


                <span class="transfer-status ${estado.clase}">

                    <span></span>

                    ${estado.texto}

                </span>

            </div>


            <div class="transfer-detail-route">

                <div>

                    <small>SUCURSAL DE ORIGEN</small>

                    <strong>
                        ${escapeHTML(item.sucursalOrigen)}
                    </strong>

                    <span>
                        ${escapeHTML(item.ciudadOrigen || '')}
                    </span>

                </div>


                <i class="fa-solid fa-arrow-right-long"></i>


                <div>

                    <small>SUCURSAL DESTINO</small>

                    <strong>
                        ${escapeHTML(item.sucursalDestino)}
                    </strong>

                    <span>
                        ${escapeHTML(item.ciudadDestino || '')}
                    </span>

                </div>

            </div>


            <div class="transfer-detail-meta">

                <div>

                    <small>Solicitó</small>

                    <strong>
                        ${escapeHTML(item.usuarioSolicitante || '—')}
                    </strong>

                </div>


                <div>

                    <small>Responsable</small>

                    <strong>
                        ${escapeHTML(item.usuarioResponsable || 'Pendiente')}
                    </strong>

                </div>


                <div>

                    <small>Referencias</small>

                    <strong>${detalles.length}</strong>

                </div>


                <div>

                    <small>Unidades solicitadas</small>

                    <strong>${unidadesSolicitadas}</strong>

                </div>


                <div>

                    <small>Unidades aprobadas</small>

                    <strong>${unidadesAprobadas}</strong>

                </div>


                <div>

                    <small>Última respuesta</small>

                    <strong>

                        ${item.fechaRespuesta
                ? fechaTransferencia(item.fechaRespuesta)
                : 'Pendiente'}

                    </strong>

                </div>

            </div>


            <div class="transfer-detail-lines">

                <div class="transfer-detail-lines-head">

                    <strong>
                        Prendas de la transferencia
                    </strong>

                    <span>
                        ${detalles.length} referencias
                    </span>

                </div>


                ${detalles.map(line => `

                    <div class="transfer-detail-line">

                        <span class="transfer-line-product-icon">

                            <i class="fa-solid fa-shirt"></i>

                        </span>


                        <span class="transfer-line-description">

                            <strong>
                                ${escapeHTML(line.nombreProducto)}
                            </strong>

                            <small>

                                ${escapeHTML(line.codigoProducto)}

                                · ${escapeHTML(line.codigoBarras)}

                                · ${escapeHTML(line.talla)}

                                / ${escapeHTML(line.color)}

                            </small>

                        </span>


                        <span class="transfer-detail-quantities">

                            <small>Solicitadas</small>

                            <b>
                                ${Number(line.cantidadSolicitada) || 0}
                            </b>

                        </span>


                        <span class="transfer-detail-quantities">

                            <small>Aprobadas</small>

                            <b>
                                ${Number(line.cantidadAprobada) || 0}
                            </b>

                        </span>

                    </div>

                `).join('')}

            </div>


            ${item.observacion ? `

                <div class="transfer-detail-observation">

                    <small>OBSERVACIONES</small>

                    <p>
                        ${escapeHTML(item.observacion)
                    .replace(/\n/g, '<br>')}
                    </p>

                </div>

            ` : ''}


            ${item.puedeRechazar ? `

                <div class="transfer-rejection-field">

                    <label for="transferRejectReason">
                        Motivo del rechazo
                    </label>

                    <textarea
                        id="transferRejectReason"
                        class="textarea"
                        maxlength="500"
                        placeholder="Explica por qué no es posible atender esta solicitud..."
                    ></textarea>

                    <small>
                        Este motivo quedará registrado en la transferencia.
                    </small>

                </div>

            ` : ''}

        `;


        let buttons = `

            <button class="btn" type="button" data-close>
                Cerrar
            </button>

        `;


        if (item.puedeAprobar) {

            buttons += `

                <button
                    class="btn btn-red"
                    type="button"
                    data-action="approve"
                    data-id="${item.idTransferencia}"
                >

                    <i class="fa-solid fa-check"></i>

                    Aprobar y despachar

                </button>


                <button
                    class="btn transfer-reject-button"
                    type="button"
                    data-action="reject"
                    data-id="${item.idTransferencia}"
                >

                    Rechazar

                </button>

            `;

        } else if (item.puedeRecibir) {

            buttons += `

                <button
                    class="btn btn-red"
                    type="button"
                    data-action="receive"
                    data-id="${item.idTransferencia}"
                >

                    <i class="fa-solid fa-box-open"></i>

                    Confirmar recepción

                </button>

            `;

        }


        actions.innerHTML = buttons;


    } catch (error) {

        content.innerHTML = `

            <div class="transfer-empty transfer-empty-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    No fue posible consultar la transferencia
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

            </div>

        `;

    }

}






async function ejecutarAccionTransferencia(
    accion,
    id
) {

    if (!Number.isInteger(id) || id <= 0) return;


    let body;


    if (accion === 'aprobar') {

        if (!window.confirm(

            'Al aprobar, las unidades solicitadas se descontarán del inventario de origen y la transferencia quedará en tránsito. ¿Deseas continuar?'

        )) return;

    } else if (accion === 'recibir') {

        if (!window.confirm(

            'Al confirmar la recepción, las unidades aprobadas se sumarán al inventario de tu sucursal. ¿Confirmas que recibiste la mercancía?'

        )) return;

    } else if (accion === 'rechazar') {

        const motivo = document
            .getElementById('transferRejectReason')
            ?.value.trim();


        if (!motivo) {

            showToast(
                'Motivo requerido',
                'Escribe el motivo por el que se rechaza la solicitud.'
            );

            return;

        }


        if (!window.confirm(

            '¿Confirmas el rechazo de esta transferencia? No se modificarán existencias.'

        )) return;


        body = JSON.stringify({

            observacion: motivo

        });

    } else {

        return;

    }


    const url =

        `/api/transferencias/${id}/${accion}`;


    try {

        const respuesta = await transferenciaFetch(

            url,

            {

                method: 'POST',

                ...(body ? { body } : {})

            }

        );


        const mensajes = {

            aprobar: [

                'Transferencia aprobada',

                'Las existencias fueron descontadas del origen. La transferencia está en tránsito.'

            ],

            recibir: [

                'Transferencia recibida',

                'Las existencias fueron sumadas al inventario de destino.'

            ],

            rechazar: [

                'Solicitud rechazada',

                'La solicitud fue rechazada sin modificar existencias.'

            ]

        };


        showToast(

            mensajes[accion][0],

            respuesta.referencia

                ? `${respuesta.referencia}: ${mensajes[accion][1]}`

                : mensajes[accion][1]

        );


        await cargarTransferencias();


        if (!document.querySelector(
            '[data-modal-content="detail-transfer"]'
        )?.classList.contains('hidden')) {

            await cargarDetalleTransferencia(id);

        }


    } catch (error) {

        console.error(
            `Error al ${accion} transferencia:`,
            error
        );

        showToast(
            'No fue posible completar la acción',
            error.message
        );

    }

}

let lectorCamaraBarcode = null;
let controlesCamaraBarcode = null;
let escaneoCamaraActivo = false;

async function iniciarLectorCamara() {
    const video = document.getElementById('barcodeVideo');
    const input = document.getElementById('barcodeInput');
    const estado = document.getElementById('barcodeCameraStatus');
    const botonIniciar = document.getElementById('barcodeStartCamera');
    const botonDetener = document.getElementById('barcodeStopCamera');

    if (!video || !input || !estado) return;

    if (!navigator.mediaDevices?.getUserMedia) {
        estado.textContent =
            'La cámara requiere HTTPS o abrir la aplicación mediante localhost.';
        return;
    }

    if (!window.ZXingBrowser?.BrowserMultiFormatReader) {
        estado.textContent =
            'No se cargó la biblioteca ZXing. Revisa el script en el HTML.';
        console.error('ZXingBrowser no está disponible.');
        return;
    }

    detenerLectorCamara(false);

    try {
        lectorCamaraBarcode = new ZXingBrowser.BrowserMultiFormatReader();
        escaneoCamaraActivo = true;

        botonIniciar.disabled = true;
        botonDetener.disabled = false;
        estado.textContent =
            'Solicitando permiso para utilizar la cámara...';

        const controles = await lectorCamaraBarcode.decodeFromConstraints(
            {
                video: {
                    facingMode: { ideal: 'environment' }
                },
                audio: false
            },
            video,
            (resultado, error) => {
                if (!resultado || !escaneoCamaraActivo) return;

                const codigo = String(resultado.getText() || '').trim();
                if (!codigo) return;


                escaneoCamaraActivo = false;

                detenerLectorCamara(false);


                input.value = codigo;
                input.dispatchEvent(
                    new Event('input', { bubbles: true })
                );


                procesarCodigoBarras(codigo);

                estado.textContent = `Código leído: ${codigo}`;
            }
        );

        controlesCamaraBarcode = controles;


        if (!escaneoCamaraActivo) {
            controlesCamaraBarcode.stop();
            controlesCamaraBarcode = null;
        } else {
            estado.textContent =
                'Cámara activa. Enfoca el código de barras dentro de la imagen.';
        }

    } catch (error) {
        console.error('Error al iniciar la cámara:', error);

        detenerLectorCamara(false);

        if (error.name === 'NotAllowedError') {
            estado.textContent =
                'Permite el acceso a la cámara en el navegador para continuar.';
        } else if (error.name === 'NotFoundError') {
            estado.textContent =
                'No se encontró una cámara disponible en este dispositivo.';
        } else if (error.name === 'NotReadableError') {
            estado.textContent =
                'La cámara está ocupada por otra aplicación o no está disponible.';
        } else {
            estado.textContent =
                `No fue posible iniciar la cámara: ${error.message || error.name}`;
        }
    }
}

function detenerLectorCamara(actualizarEstado = true) {
    escaneoCamaraActivo = false;

    if (controlesCamaraBarcode) {
        try {
            controlesCamaraBarcode.stop();
        } catch (error) {
            console.warn('No se pudo detener el lector:', error);
        }

        controlesCamaraBarcode = null;
    }

    const video = document.getElementById('barcodeVideo');

    if (video?.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    const botonIniciar = document.getElementById('barcodeStartCamera');
    const botonDetener = document.getElementById('barcodeStopCamera');
    const estado = document.getElementById('barcodeCameraStatus');

    if (botonIniciar) botonIniciar.disabled = false;
    if (botonDetener) botonDetener.disabled = true;

    if (actualizarEstado && estado) {
        estado.textContent = 'Cámara detenida. Puedes volver a activarla.';
    }
}





let scannerAudioContext = null;
let scannerReadTimer = null;


function activarAudioLector() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!scannerAudioContext) {
            scannerAudioContext = new AudioContextClass();
        }

        if (scannerAudioContext.state === 'suspended') {
            scannerAudioContext.resume().catch(error => {
                console.warn('No se pudo activar el sonido:', error);
            });
        }
    } catch (error) {
        console.warn('El sonido no está disponible:', error);
    }
}

async function reproducirPitido(tipo = 'success') {
    try {
        activarAudioLector();

        if (!scannerAudioContext) return;

        if (scannerAudioContext.state === 'suspended') {
            await scannerAudioContext.resume();
        }

        const ahora = scannerAudioContext.currentTime;

        const notas = tipo === 'success'
            ? [
                { frecuencia: 880, inicio: 0, duracion: 0.075 },
                { frecuencia: 1175, inicio: 0.095, duracion: 0.105 }
            ]
            : [
                { frecuencia: 330, inicio: 0, duracion: 0.13 },
                { frecuencia: 250, inicio: 0.17, duracion: 0.15 }
            ];

        notas.forEach(nota => {
            const oscilador =
                scannerAudioContext.createOscillator();

            const volumen =
                scannerAudioContext.createGain();

            const inicio = ahora + nota.inicio;
            const fin = inicio + nota.duracion;

            oscilador.type = 'sine';
            oscilador.frequency.setValueAtTime(
                nota.frecuencia,
                inicio
            );

            volumen.gain.setValueAtTime(0.0001, inicio);

            volumen.gain.linearRampToValueAtTime(
                0.50,
                inicio + 0.012
            );

            volumen.gain.setValueAtTime(
                0.50,
                fin - 0.025
            );

            volumen.gain.linearRampToValueAtTime(
                0.0001,
                fin
            );

            oscilador.connect(volumen);
            volumen.connect(scannerAudioContext.destination);

            oscilador.start(inicio);
            oscilador.stop(fin + 0.01);
        });

    } catch (error) {
        console.warn('No se pudo reproducir el pitido:', error);
    }
}

function actualizarEstadoLector(estado, titulo, mensaje) {
    const panel = document.getElementById('scannerStatus');

    if (!panel) return;

    panel.dataset.state = estado;

    const tituloElemento =
        panel.querySelector('[data-scanner-status-title]');

    const mensajeElemento =
        panel.querySelector('[data-scanner-status-message]');

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (mensajeElemento) {
        mensajeElemento.textContent = mensaje;
    }
}

function obtenerFilaProducto(codigo) {
    const filas = [
        ...document.querySelectorAll('#inventoryRows tr')
    ].filter(fila => fila.cells.length >= 4);

    const codigoBuscado = String(codigo ?? '').trim();

    if (!codigoBuscado) {
        return null;
    }

    return filas.find(fila => {
        const codigoFila = String(
            fila.cells[0]?.textContent ?? ''
        ).trim();

        return codigoFila === codigoBuscado;
    }) || null;
}

function mostrarResultadoEscaner({
    encontrado,
    codigo,
    nombre = '',
    stock = ''
}) {
    const resultado = document.getElementById('barcodeResult');

    if (!resultado) return;

    if (!encontrado) {
        resultado.innerHTML = `
            <div class="scanner-product-result error">
                <div class="scanner-product-result-head">
                    <div class="scanner-result-icon">
                        <i class="fa-solid fa-triangle-exclamation"
                           aria-hidden="true"></i>
                    </div>

                    <div>
                        <div class="scanner-result-eyebrow">
                            Código sin identificar
                        </div>

                        <h4 class="scanner-product-name">
                            No se encontró la prenda
                        </h4>

                        <span class="scanner-product-code">
                            Código: ${escapeHTML(codigo)}
                        </span>
                    </div>
                </div>
            </div>
        `;

        return;
    }

    resultado.innerHTML = `
        <div class="scanner-product-result">
            <div class="scanner-product-result-head">
                <div class="scanner-result-icon">
                    <i class="fa-solid fa-check"
                       aria-hidden="true"></i>
                </div>

                <div>
                    <div class="scanner-result-eyebrow">
                        Producto identificado
                    </div>

                    <h4 class="scanner-product-name">
                        ${escapeHTML(nombre)}
                    </h4>

                    <span class="scanner-product-code">
                        Ref. ${escapeHTML(codigo)}
                    </span>
                </div>
            </div>

            <div class="scanner-product-meta">
                <div>
                    <span>Código de producto</span>
                    <strong>${escapeHTML(codigo)}</strong>
                </div>

                <div>
                    <span>Stock en sistema</span>
                    <strong>${escapeHTML(stock)} unidades</strong>
                </div>
            </div>
        </div>
    `;
}

function procesarCodigoBarras(codigoForzado = null) {
    if (scannerReadTimer !== null) {
        clearTimeout(scannerReadTimer);
        scannerReadTimer = null;
    }

    const input = document.getElementById('barcodeInput');
    if (!input) return;

    const codigo = String(
        codigoForzado ?? input.value
    ).trim();

    if (!codigo) return;

    const fila = obtenerFilaProducto(codigo);

    if (!fila) {
        actualizarEstadoLector(
            'error',
            'Código no identificado',
            'No se encontró esa referencia en el inventario.'
        );

        mostrarResultadoEscaner({
            encontrado: false,
            codigo
        });

        void reproducirPitido('error');

        input.value = '';
        input.focus();
        return;
    }

    const codigoProducto =
        fila.cells[0]?.textContent.trim() || codigo;

    const nombreProducto =
        fila.querySelector('.product-name')?.textContent.trim()
        || fila.cells[1]?.textContent.trim()
        || 'Prenda sin nombre';

    const stockProducto =
        fila.cells[3]?.textContent.trim() || '—';

    mostrarResultadoEscaner({
        encontrado: true,
        codigo: codigoProducto,
        nombre: nombreProducto,
        stock: stockProducto
    });

    actualizarEstadoLector(
        'success',
        'Lectura correcta',
        'Producto identificado. Puedes escanear la siguiente prenda.'
    );

    void reproducirPitido('success');

    input.value = '';
    input.focus();
}

function findBarcodeProduct() {
    procesarCodigoBarras();
}

function programarLecturaAutomatica() {
    if (scannerReadTimer !== null) {
        clearTimeout(scannerReadTimer);
    }

    const input = document.getElementById('barcodeInput');

    if (!input || !input.value.trim()) return;




    scannerReadTimer = window.setTimeout(() => {
        scannerReadTimer = null;
        procesarCodigoBarras();
    }, 400);
}

document.addEventListener('click', async (event) => {

    if (event.target.closest('[data-count-create]')) {
        await crearConteoFisico();
        return;
    }


    if (event.target.closest('[data-count-save-detail]')) {
        await guardarDetalleConteoFisico();
        return;
    }


    if (event.target.closest('[data-count-finalize]')) {
        await finalizarConteoFisico();
        return;
    }


    if (event.target.closest('[data-count-apply]')) {
        await aplicarConteoFisico();
        return;
    }


    if (event.target.closest('[data-count-reload]')) {
        await cargarConteosFisicos();
        return;
    }


    const pickCountVariant = event.target.closest(
        '[data-count-pick-variant]'
    );

    if (pickCountVariant) {
        seleccionarVarianteConteo(
            Number(pickCountVariant.dataset.countPickVariant)
        );
        return;
    }


    const editCountVariant = event.target.closest(
        '[data-count-edit-variant]'
    );

    if (editCountVariant) {
        seleccionarDetalleParaEditarConteo(
            Number(editCountVariant.dataset.countEditVariant)
        );
        return;
    }


    if (event.target.closest('[data-count-cancel-selection]')) {
        limpiarEditorVarianteConteo();
        return;
    }

    const movementTypeButton = event.target.closest(
        '[data-movement-type]'
    );

    if (movementTypeButton) {

        seleccionarTipoMovimiento(
            movementTypeButton.dataset.movementType
        );

        return;
    }



    const addMovementVariantButton = event.target.closest(
        '[data-add-movement-variant]'
    );

    if (addMovementVariantButton) {

        agregarVarianteMovimiento(
            Number(addMovementVariantButton.dataset.addMovementVariant)
        );

        return;
    }



    const removeMovementVariantButton = event.target.closest(
        '[data-remove-movement-variant]'
    );

    if (removeMovementVariantButton) {

        const variantId = Number(
            removeMovementVariantButton.dataset.removeMovementVariant
        );

        movementDraft.detalles =
            movementDraft.detalles.filter(
                item => item.idProductoVariante !== variantId
            );

        renderizarDetallesMovimiento();

        return;
    }

    const viewButton = event.target.closest('[data-view]');
    if (viewButton) {
        setView(viewButton.dataset.view);
        return;
    }

    const closeButton = event.target.closest('[data-close]');
    if (closeButton) {
        closeModal();
        return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
        handleAction(actionButton.dataset.action, actionButton.dataset.id);
        return;
    }

    if (event.target.closest('[data-save-product]')) {

        const grupo = document.getElementById('grupo')?.value;
        const tipoProducto = document.getElementById('tipoProducto')?.value;
        const modelo = document.getElementById('modelo')?.value;

        const nombre = document.getElementById('nombreProducto')?.value.trim();
        const precio = document.getElementById('precioProducto')?.value;
        const descripcion =
            document.getElementById('descripcionProducto')?.value.trim() || '';

        const talla = document.getElementById('talla')?.value;
        const color = document.getElementById('color')?.value;

        const temporadaValor = document.getElementById('temporada')?.value;
        const stockValor = document.getElementById('stock')?.value;


        if (
            !grupo ||
            !tipoProducto ||
            !modelo ||
            !nombre ||
            precio === '' ||
            precio == null ||
            !talla ||
            !color ||
            stockValor === '' ||
            stockValor == null ||
            !Number.isInteger(Number(stockValor)) ||
            Number(stockValor) < 0
        ) {
            showToast(
                'Datos incompletos',
                'Completa los campos obligatorios y verifica que el stock sea un entero igual o mayor que cero.'
            );
            return;
        }


        const boton = event.target.closest('[data-save-product]');

        if (boton.disabled) return;

        boton.disabled = true;

        const datos = {
            codigoGrupo: grupo,
            codigoTipoProducto: tipoProducto,
            codigoModelo: modelo,
            nombre: nombre,
            descripcion: descripcion,
            precio: Number(precio),
            talla: talla,
            color: color,
            idTemporada: temporadaValor ? Number(temporadaValor) : null,
            stock: Number(stockValor)
        };

        const estabaEditando = productoEnEdicion !== null;

        const url = estabaEditando
            ? `/api/productos/${encodeURIComponent(productoEnEdicion)}/completo`
            : '/api/productos/crear-completo';

        const metodo = estabaEditando ? 'PUT' : 'POST';

        fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        })
            .then(async response => {
                const resultado = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        resultado.detail ||
                        resultado.message ||
                        resultado.mensaje ||
                        'No fue posible guardar la prenda.'
                    );
                }

                return resultado;
            })
            .then(producto => {
                const codigo = producto.codigoProducto;

                productoEnEdicion = null;

                prepararModalNuevaPrenda();
                closeModal();

                showToast(
                    estabaEditando ? 'Prenda actualizada' : 'Prenda guardada',
                    `Código: ${codigo}`
                );

                document.dispatchEvent(
                    new CustomEvent('anb:producto-guardado', {
                        detail: { producto }
                    })
                );
            })
            .catch(error => {
                showToast(
                    estabaEditando ? 'Error al actualizar' : 'Error al guardar',
                    error.message
                );
            })
            .finally(() => {
                boton.disabled = false;
            });

        return;
    }

    if (event.target.closest('[data-save-movement]')) {
        guardarMovimientoDesdeModal();
        return;
    }





    if (event.target.closest('[data-save-transfer]')) {

        void guardarTransferencia();

        return;
    }






    if (event.target.closest('[data-reload-transfers]')) {

        void cargarTransferencias();

        return;
    }






    const addTransferVariantButton = event.target.closest(
        '[data-add-transfer-variant]'
    );

    if (addTransferVariantButton) {

        agregarVarianteTransferencia(
            Number(addTransferVariantButton.dataset.addTransferVariant)
        );

        return;
    }






    const removeTransferVariantButton = event.target.closest(
        '[data-remove-transfer-variant]'
    );

    if (removeTransferVariantButton) {

        const idVariante = Number(
            removeTransferVariantButton.dataset.removeTransferVariant
        );

        transferDraft.detalles =
            transferDraft.detalles.filter(
                linea => linea.idProductoVariante !== idVariante
            );

        renderizarLineasTransferencia();

        return;
    }

    if (event.target.closest('[data-print-labels]')) {
        imprimirEtiquetas();
        return;
    }

    if (event.target.closest('[data-print]')) {
        closeModal();
        window.print();
        return;
    }
});

document.getElementById('newProductBtn')?.addEventListener('click', () => {
    prepararModalNuevaPrenda();
    openModal('new-product');
});

document.getElementById('barcodeBtn').addEventListener('click', () => openModal('barcode'));

document.getElementById('labelsBtn')?.addEventListener('click', () => {
    abrirModalEtiquetas();
});

document.getElementById('labelCode')?.addEventListener('change', async event => {
    const codigo = event.target.value.trim();

    if (!codigo) {
        document.getElementById('labelPrice').value = '';
        document.getElementById('labelBarcodeText').textContent =
            'Seleccione una prenda';
        document.getElementById('labelBarcodeSvg').replaceChildren();
        document.getElementById('labelDetails').textContent =
            'Talla · Color · Precio';
        return;
    }

    await prepararModalEtiquetas(codigo, false);
});

document.getElementById('storeBtn').addEventListener('click', () => toggleDropdown(storeMenu, document.getElementById('storeBtn')));
document.getElementById('userBtn').addEventListener('click', () => toggleDropdown(userMenu, document.getElementById('userBtn')));
document.getElementById('logoutBtn')?.addEventListener('click', cerrarSesionActual);
document.getElementById('mobileBtn').addEventListener('click', () => {
    const button = document.getElementById('mobileBtn');
    const isOpen = navTabs.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
});

modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) closeModal();
});

window.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown-wrap')) {
        document.querySelectorAll('.dropdown').forEach((dropdown) => dropdown.classList.remove('open'));
        document.querySelectorAll('.selector').forEach((selector) => selector.setAttribute('aria-expanded', 'false'));
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
        document.querySelectorAll('.dropdown').forEach((dropdown) => dropdown.classList.remove('open'));
    }
});

document.getElementById("inventorySearch")
    ?.addEventListener("input", filterInventory);

document.getElementById("sizeFilter")
    ?.addEventListener("change", filterInventory);

document.getElementById("groupFilter")
    ?.addEventListener("change", filterInventory);

document.getElementById("typeFilter")
    ?.addEventListener("change", filterInventory);

document.addEventListener('anb:producto-guardado', () => {
    cargarInventario();
});

inicializarEncabezadoSesion();
inicializarFiltrosPremium();
inicializarSelectsEtiquetasPremium();
inicializarDireccionDevolucionPremium();
cargarFiltrosInventario();
cargarInventario();
cargarHistorialMovimientos();
void actualizarBadgeTransferencias();

document.getElementById('movementSearch').addEventListener('input', filterMovements);
document.getElementById('movementTypeFilter').addEventListener('change', filterMovements);
document.getElementById('movementDateFilter').addEventListener('change', filterMovements);
document.getElementById('transferStatusFilter').addEventListener('change', () => filterCards('transferStatusFilter', '#transferCards [data-transfer-status]', 'transferStatus'));
inicializarEventosConteoFisico();
cargarConteosFisicos();

document.getElementById('barcodeInput')
    ?.addEventListener('input', programarLecturaAutomatica);


document.getElementById('barcodeInput')
    ?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            procesarCodigoBarras();
        }
    });

document.querySelector('[data-scanner-submit]')
    ?.addEventListener('click', () => {
        procesarCodigoBarras();
    });

document.getElementById('barcodeStartCamera')
    ?.addEventListener('click', iniciarLectorCamara);

document.getElementById('barcodeStopCamera')
    ?.addEventListener('click', () => detenerLectorCamara());

document.getElementById('movementVariantSearch')
    ?.addEventListener('input', event => {

        window.clearTimeout(movementSearchTimer);


        movementSearchRequest++;

        const termino = event.target.value.trim();


        if (termino.length < 2) {

            movementSearchResults = [];

            ocultarResultadosVariantes();

            return;
        }

        movementSearchTimer = window.setTimeout(() => {

            movementSearchTimer = null;

            buscarVariantesMovimiento(termino);

        }, 280);
    });

document.getElementById('movementReturnDirectionSelect')
    ?.addEventListener('change', event => {

        movementDraft.direccionDevolucion = event.target.value;

        renderizarDetallesMovimiento();
    });

document.getElementById('movementSelectedItems')
    ?.addEventListener('change', event => {

        const input = event.target.closest(
            '[data-movement-quantity]'
        );

        if (!input) return;

        const id = Number(input.dataset.movementQuantity);

        const item = movementDraft.detalles.find(
            linea => linea.idProductoVariante === id
        );

        if (!item) return;

        item.cantidad = input.value;

        renderizarDetallesMovimiento();
    });

document.addEventListener('change', event => {

    const quantityInput = event.target.closest(
        '[data-transfer-quantity]'
    );

    if (!quantityInput) return;

    const idVariante = Number(
        quantityInput.dataset.transferQuantity
    );

    const linea = transferDraft.detalles.find(
        item => item.idProductoVariante === idVariante
    );

    if (!linea) return;

    let cantidad = Number.parseInt(
        quantityInput.value,
        10
    );

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        cantidad = 1;
    }

    if (cantidad > linea.existenciaDisponible) {
        cantidad = linea.existenciaDisponible;
    }

    linea.cantidad = cantidad;
    quantityInput.value = String(cantidad);

    actualizarResumenTransferencia();

});



document.getElementById('transferStatusFilter')
    ?.addEventListener('change', filtrarTransferencias);




document.getElementById('transferSearch')
    ?.addEventListener('input', filtrarTransferencias);




document.getElementById('transferOriginStore')
    ?.addEventListener(
        'change',
        cambiarSucursalOrigenTransferencia
    );




document.getElementById('transferVariantSearch')
    ?.addEventListener('input', event => {

        window.clearTimeout(transferSearchTimer);

        transferSearchRequest++;

        const termino = event.target.value.trim();

        const results = document.getElementById(
            'transferVariantResults'
        );


        if (termino.length < 2) {

            transferSearchResults = [];

            results?.replaceChildren();

            results?.classList.add('hidden');

            return;
        }


        transferSearchTimer = window.setTimeout(() => {

            transferSearchTimer = null;

            void buscarVariantesTransferencia(termino);

        }, 280);

    });

document.addEventListener('visibilitychange', () => {

    if (!document.hidden) {

        void actualizarBadgeTransferencias();

    }

});

setView('dashboard');
