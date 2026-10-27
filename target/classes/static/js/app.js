'use strict';

const navTabs = document.getElementById('navTabs');
const modalBackdrop = document.getElementById('modalBackdrop');
const modal = document.getElementById('modal');
const storeMenu = document.getElementById('storeMenu');
const userMenu = document.getElementById('userMenu');
const stores = {
    med: { name: 'Medellín Centro', municipality: 'Medellín' },
    bel: { name: 'Bello', municipality: 'Bello' },
    sab: { name: 'Sabaneta', municipality: 'Sabaneta' },
    env: { name: 'Envigado', municipality: 'Envigado' },
    iti: { name: 'Itagüí', municipality: 'Itagüí' },
    cedi: { name: 'CEDI Aburrá', municipality: 'Medellín' }
};

let currentStoreId = 'med';

const tallasPorModelo = {
    "01": ["RN", "0M", "0-3M"],
    "02": ["3M", "3-6M", "6M"],
    "03": ["6M", "6-9M", "9M"],
    "04": ["9M", "9-12M", "12M"]
};


function inicializarFiltrosPremium() {
    const ids = ['sizeFilter', 'groupFilter', 'typeFilter'];

    ids.forEach(id => {
        const select = document.getElementById(id);

        if (!select || select.dataset.premiumReady === 'true') {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'inventory-premium-select';

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
}

function openModal(name) {
    const content = modal.querySelectorAll('[data-modal-content]');
    content.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.modalContent !== name);
    });
    modalBackdrop.classList.remove('hidden');
    document.getElementById('storeMenu').classList.remove('open');
    document.getElementById('userMenu').classList.remove('open');

    if (name === 'barcode') {
        const input = document.getElementById('barcodeInput');
        input.value = '';
        document.getElementById('barcodeResult').textContent = '';
        window.setTimeout(() => input.focus(), 0);
    }
}

function closeModal() {
    modalBackdrop.classList.add('hidden');
    modal.querySelectorAll('[data-modal-content]').forEach((panel) => panel.classList.add('hidden'));
}

function showToast(title, message) {
    const template = document.getElementById('toastTemplate');
    const toast = template.content.firstElementChild.cloneNode(true);
    toast.querySelector('[data-toast-title]').textContent = title;
    toast.querySelector('[data-toast-message]').textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3000);
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

function selectStore(storeId) {
    const store = stores[storeId];
    if (!store) return;
    currentStoreId = storeId;
    document.getElementById('currentStore').textContent = store.name;
    document.querySelectorAll('[data-store-name]').forEach((element) => {
        element.textContent = store.name;
    });
    document.querySelectorAll('[data-store-municipality]').forEach((element) => {
        element.textContent = store.municipality;
    });
    storeMenu.querySelectorAll('[data-store]').forEach((button) => {
        button.classList.toggle('active', button.dataset.store === storeId);
    });
    storeMenu.classList.remove('open');
    document.getElementById('storeBtn').setAttribute('aria-expanded', 'false');
    showToast('Punto de venta cambiado', store.name);
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
            openModal('labels');
            break;

        case 'detail-transfer':
            openModal('detail-transfer');
            break;

        case 'count':
            showToast('Conteo físico', 'Se abrirá una nueva sesión de conteo.');
            break;

        case 'open-count':
            openModal('count-detail');
            break;

        case 'apply-count':
            showToast('Conteo físico', 'El ajuste está listo para revisión.');
            break;

        case 'approve':
            showToast('Transferencia aprobada', 'La solicitud queda lista para despacho.');
            break;

        case 'receive':
            showToast('Transferencia recibida', 'La entrada se registra en la tienda destino.');
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
    if (titulo) titulo.textContent = 'Nueva Prenda · Código 8D';

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
                <td class="mono">—</td>
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

function filterMovements() {
    const query = document.getElementById('movementSearch').value.trim().toLocaleLowerCase('es');
    const type = document.getElementById('movementTypeFilter').value;

    document.querySelectorAll('#movementRows tr').forEach((row) => {
        const text = row.textContent.toLocaleLowerCase('es');
        const movement = row.cells[1].textContent.trim();
        const matchesQuery = !query || text.includes(query);
        const matchesType = !type || movement.includes(type);
        row.classList.toggle('hidden', !(matchesQuery && matchesType));
    });
}

function filterCards(selectId, cardSelector, dataAttribute) {
    const selected = document.getElementById(selectId).value;
    document.querySelectorAll(cardSelector).forEach((card) => {
        card.classList.toggle('hidden', Boolean(selected) && card.dataset[dataAttribute] !== selected);
    });
}

function findBarcodeProduct() {
    const input = document.getElementById('barcodeInput');
    const result = document.getElementById('barcodeResult');
    const code = input.value.trim().toLocaleLowerCase('es');
    result.textContent = '';
    if (!code) return;

    const rows = [...document.querySelectorAll('#inventoryRows tr')];
    const match = rows.find((row) => row.cells[0].textContent.trim().toLocaleLowerCase('es') === code)
        || rows.find((row) => row.textContent.toLocaleLowerCase('es').includes(code));

    if (!match) {
        result.textContent = 'No se encontró una prenda con ese código o nombre.';
        return;
    }

    const product = match.querySelector('.product-name')?.textContent.trim() || match.cells[1].textContent.trim();
    const stock = match.cells[3].textContent.trim();
    result.textContent = `Producto encontrado: ${product} · Referencia ${match.cells[0].textContent.trim()} · Stock ${stock} unidades.`;
}

document.addEventListener('click', (event) => {
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

    const storeButton = event.target.closest('[data-store]');
    if (storeButton) {
        selectStore(storeButton.dataset.store);
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
        closeModal();
        showToast('Movimiento registrado', 'La existencia fue actualizada y auditada.');
        return;
    }

    if (event.target.closest('[data-save-transfer]')) {
        closeModal();
        showToast('Transferencia solicitada', 'Se creó la solicitud pendiente de aprobación.');
        return;
    }

    if (event.target.closest('[data-print]')) {
        closeModal();
        window.print();
    }
});

document.getElementById('newProductBtn')?.addEventListener('click', () => {
    prepararModalNuevaPrenda();
    openModal('new-product');
});

document.getElementById('barcodeBtn').addEventListener('click', () => openModal('barcode'));
document.getElementById('labelsBtn').addEventListener('click', () => openModal('labels'));
document.getElementById('storeBtn').addEventListener('click', () => toggleDropdown(storeMenu, document.getElementById('storeBtn')));
document.getElementById('userBtn').addEventListener('click', () => toggleDropdown(userMenu, document.getElementById('userBtn')));
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

inicializarFiltrosPremium();
cargarFiltrosInventario();
cargarInventario();

document.getElementById('movementSearch').addEventListener('input', filterMovements);
document.getElementById('movementTypeFilter').addEventListener('change', filterMovements);
document.getElementById('transferStatusFilter').addEventListener('change', () => filterCards('transferStatusFilter', '#transferCards [data-transfer-status]', 'transferStatus'));
document.getElementById('countStatusFilter').addEventListener('change', () => filterCards('countStatusFilter', '#countCards [data-count-status]', 'countStatus'));
document.getElementById('barcodeInput').addEventListener('input', findBarcodeProduct);

setView('dashboard');
