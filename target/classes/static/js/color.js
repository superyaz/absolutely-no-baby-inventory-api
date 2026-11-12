document.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("colorPicker");
    const trigger = document.getElementById("colorTrigger");
    const valueContainer = document.getElementById("colorValue");
    const optionsContainer = document.getElementById("colorOptions");
    const colorInput = document.getElementById("color");
    if (
        !picker ||
        !trigger ||
        !valueContainer ||
        !optionsContainer ||
        !colorInput
    ) {
        return;
    }
    const colores = [
        { nombre: "Negro", hex: "#171717", grupo: "Neutros" },
        { nombre: "Blanco", hex: "#FFFFFF", grupo: "Neutros" },
        { nombre: "Marfil", hex: "#FFF8E7", grupo: "Neutros" },
        { nombre: "Crema", hex: "#F5E6C8", grupo: "Neutros" },
        { nombre: "Crudo", hex: "#F1E9D2", grupo: "Neutros" },
        { nombre: "Natural", hex: "#E6D5B8", grupo: "Neutros" },
        { nombre: "Beige", hex: "#D7C3A3", grupo: "Neutros" },
        { nombre: "Arena", hex: "#C8B08B", grupo: "Neutros" },
        { nombre: "Nude", hex: "#E8C3A7", grupo: "Neutros" },
        { nombre: "Camel", hex: "#C19A6B", grupo: "Neutros" },
        { nombre: "Café", hex: "#795548", grupo: "Neutros" },
        { nombre: "Chocolate", hex: "#4E342E", grupo: "Neutros" },
        { nombre: "Taupe", hex: "#8B7D75", grupo: "Neutros" },
        { nombre: "Gris claro", hex: "#D6D6D6", grupo: "Neutros" },
        { nombre: "Gris", hex: "#9E9E9E", grupo: "Neutros" },
        { nombre: "Plomo", hex: "#607D8B", grupo: "Neutros" },
        { nombre: "Gris oscuro", hex: "#616161", grupo: "Neutros" },
        { nombre: "Rojo", hex: "#E53935", grupo: "Rojos y cálidos" },
        { nombre: "Coral", hex: "#FF7F50", grupo: "Rojos y cálidos" },
        { nombre: "Salmón", hex: "#FA8072", grupo: "Rojos y cálidos" },
        { nombre: "Durazno", hex: "#FFCBA4", grupo: "Rojos y cálidos" },
        { nombre: "Terracota", hex: "#C65D3B", grupo: "Rojos y cálidos" },
        { nombre: "Naranja", hex: "#FB8C00", grupo: "Rojos y cálidos" },
        { nombre: "Mostaza", hex: "#D4A017", grupo: "Rojos y cálidos" },
        { nombre: "Amarillo", hex: "#FDD835", grupo: "Rojos y cálidos" },
        { nombre: "Dorado", hex: "#D4AF37", grupo: "Rojos y cálidos" },
        { nombre: "Cobre", hex: "#B87333", grupo: "Rojos y cálidos" },
        { nombre: "Vino", hex: "#722F37", grupo: "Rojos y cálidos" },
        { nombre: "Borgoña", hex: "#800020", grupo: "Rojos y cálidos" },
        { nombre: "Granate", hex: "#7B1E3A", grupo: "Rojos y cálidos" },
        { nombre: "Rosado", hex: "#F48FB1", grupo: "Rosados y violetas" },
        { nombre: "Rosa pastel", hex: "#F8BBD0", grupo: "Rosados y violetas" },
        { nombre: "Rosa palo", hex: "#D8A0A8", grupo: "Rosados y violetas" },
        { nombre: "Fucsia", hex: "#E91E63", grupo: "Rosados y violetas" },
        { nombre: "Magenta", hex: "#C2185B", grupo: "Rosados y violetas" },
        { nombre: "Lila", hex: "#CE93D8", grupo: "Rosados y violetas" },
        { nombre: "Lavanda", hex: "#B39DDB", grupo: "Rosados y violetas" },
        { nombre: "Morado", hex: "#8E44AD", grupo: "Rosados y violetas" },
        { nombre: "Violeta", hex: "#7E57C2", grupo: "Rosados y violetas" },
        { nombre: "Azul marino", hex: "#0D47A1", grupo: "Azules" },
        { nombre: "Azul oscuro", hex: "#0D2C54", grupo: "Azules" },
        { nombre: "Azul", hex: "#1976D2", grupo: "Azules" },
        { nombre: "Azul rey", hex: "#4169E1", grupo: "Azules" },
        { nombre: "Azul claro", hex: "#64B5F6", grupo: "Azules" },
        { nombre: "Celeste", hex: "#81D4FA", grupo: "Azules" },
        { nombre: "Turquesa", hex: "#26C6DA", grupo: "Azules" },
        { nombre: "Aqua", hex: "#00BCD4", grupo: "Azules" },
        { nombre: "Petróleo", hex: "#006064", grupo: "Azules" },
        { nombre: "Índigo", hex: "#3F51B5", grupo: "Azules" },
        { nombre: "Verde menta", hex: "#A5D6A7", grupo: "Verdes" },
        { nombre: "Verde agua", hex: "#80CBC4", grupo: "Verdes" },
        { nombre: "Verde", hex: "#43A047", grupo: "Verdes" },
        { nombre: "Esmeralda", hex: "#2E8B57", grupo: "Verdes" },
        { nombre: "Verde botella", hex: "#145A32", grupo: "Verdes" },
        { nombre: "Verde oliva", hex: "#808000", grupo: "Verdes" },
        { nombre: "Verde militar", hex: "#4B5320", grupo: "Verdes" },
        { nombre: "Caqui", hex: "#BDB76B", grupo: "Verdes" },
        { nombre: "Pistacho", hex: "#AED581", grupo: "Verdes" },
        { nombre: "Verde limón", hex: "#C0CA33", grupo: "Verdes" },
        { nombre: "Plateado", hex: "#C0C0C0", grupo: "Especiales" },
        { nombre: "Multicolor", patron: "multicolor", grupo: "Especiales" },
        { nombre: "Estampado", patron: "estampado", grupo: "Especiales" }
    ];
    const normalizarTexto = (texto) => {
        return String(texto ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("es")
            .trim();
    };
    const searchWrap = document.createElement("div");
    searchWrap.className = "color-picker-search-wrap";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "color-picker-search";
    searchInput.placeholder = "Buscar color...";
    searchInput.autocomplete = "off";
    searchInput.setAttribute("aria-label", "Buscar color");
    searchWrap.appendChild(searchInput);
    const optionsList = document.createElement("div");
    optionsList.className = "color-picker-list";
    optionsContainer.replaceChildren(
        searchWrap,
        optionsList
    );
    function crearPunto(color) {
        const punto = document.createElement("span");
        punto.className = "color-dot";
        if (color.hex) {
            punto.style.backgroundColor = color.hex;
        } else if (color.patron === "multicolor") {
            punto.classList.add("color-dot-multicolor");
        } else {
            punto.classList.add("color-dot-pattern");
        }
        punto.setAttribute("aria-hidden", "true");
        return punto;
    }
    function cerrarOpciones() {
        optionsContainer.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
    }
    function seleccionarColor(color) {
        colorInput.value = color.nombre;
        valueContainer.replaceChildren();
        valueContainer.appendChild(
            crearPunto(color)
        );
        const nombre = document.createElement("span");
        nombre.textContent = color.nombre;
        valueContainer.appendChild(nombre);
        optionsList
            .querySelectorAll(".color-option")
            .forEach(opcion => {
                opcion.setAttribute(
                    "aria-selected",
                    String(opcion.dataset.color === color.nombre)
                );
            });
        cerrarOpciones();
        colorInput.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }
    function renderizarOpciones(termino = "") {
        const busqueda = normalizarTexto(termino);
        const filtrados = colores.filter(color => {
            return normalizarTexto(
                `${color.nombre} ${color.grupo}`
            ).includes(busqueda);
        });
        optionsList.replaceChildren();
        if (filtrados.length === 0) {
            const vacio = document.createElement("p");
            vacio.className = "color-picker-empty";
            vacio.textContent = "No se encontraron colores.";
            optionsList.appendChild(vacio);
            return;
        }
        const grupos = [
            ...new Set(
                filtrados.map(color => color.grupo)
            )
        ];
        grupos.forEach(grupo => {
            const titulo = document.createElement("div");
            titulo.className = "color-group-title";
            titulo.textContent = grupo;
            optionsList.appendChild(titulo);
            filtrados
                .filter(color => color.grupo === grupo)
                .forEach(color => {
                    const opcion = document.createElement("button");
                    opcion.type = "button";
                    opcion.className = "color-option";
                    opcion.setAttribute("role", "option");
                    opcion.setAttribute(
                        "aria-selected",
                        String(colorInput.value === color.nombre)
                    );
                    opcion.dataset.color = color.nombre;
                    opcion.appendChild(
                        crearPunto(color)
                    );
                    const nombre = document.createElement("span");
                    nombre.textContent = color.nombre;
                    opcion.appendChild(nombre);
                    opcion.addEventListener("click", () => {
                        seleccionarColor(color);
                    });
                    optionsList.appendChild(opcion);
                });
        });
    }
    window.establecerColorProducto = function (nombreColor) {
        const valor = String(nombreColor ?? "").trim();
        const colorEncontrado = colores.find(color => {
            return (
                normalizarTexto(color.nombre) ===
                normalizarTexto(valor)
            );
        });
        if (colorEncontrado) {
            seleccionarColor(colorEncontrado);
            return;
        }
        colorInput.value = valor;
        valueContainer.replaceChildren();
        const nombre = document.createElement("span");
        nombre.textContent = valor || "Seleccione un color";
        valueContainer.appendChild(nombre);
        optionsList
            .querySelectorAll(".color-option")
            .forEach(opcion => {
                opcion.setAttribute(
                    "aria-selected",
                    String(opcion.dataset.color === valor)
                );
            });
    };
    trigger.addEventListener("click", () => {
        const estaAbierto =
            !optionsContainer.classList.contains("hidden");
        if (estaAbierto) {
            cerrarOpciones();
            return;
        }
        optionsContainer.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
        searchInput.value = "";
        renderizarOpciones();
        searchInput.focus();
    });
    searchInput.addEventListener("input", () => {
        renderizarOpciones(searchInput.value);
    });
    searchInput.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            cerrarOpciones();
            trigger.focus();
        }
        if (evento.key === "Enter") {
            evento.preventDefault();
            optionsList
                .querySelector(".color-option")
                ?.click();
        }
    });
    document.addEventListener("click", evento => {
        if (!picker.contains(evento.target)) {
            cerrarOpciones();
        }
    });
    trigger.addEventListener("keydown", evento => {
        if (evento.key === "Escape") {
            cerrarOpciones();
            trigger.focus();
        }
    });
    renderizarOpciones();
});