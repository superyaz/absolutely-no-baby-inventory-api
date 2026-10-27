
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
    ) return;

    const colores = [
        { nombre: "Negro", hex: "#171717" },
        { nombre: "Blanco", hex: "#FFFFFF" },
        { nombre: "Rojo", hex: "#E53935" },
        { nombre: "Azul", hex: "#1976D2" },
        { nombre: "Azul claro", hex: "#64B5F6" },
        { nombre: "Rosado", hex: "#F48FB1" },
        { nombre: "Verde", hex: "#43A047" },
        { nombre: "Amarillo", hex: "#FDD835" },
        { nombre: "Gris", hex: "#9E9E9E" },
        { nombre: "Beige", hex: "#D7C3A3" },
        { nombre: "Café", hex: "#795548" },
        { nombre: "Morado", hex: "#8E44AD" },
        { nombre: "Naranja", hex: "#FB8C00" },
        { nombre: "Lila", hex: "#CE93D8" },
        { nombre: "Verde oliva", hex: "#808000" },
        { nombre: "Estampado", hex: null }
    ];

    function crearPunto(color) {
        const punto = document.createElement("span");
        punto.className = "color-dot";

        if (color.hex) {
            punto.style.backgroundColor = color.hex;
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

        valueContainer.appendChild(crearPunto(color));

        const nombre = document.createElement("span");
        nombre.textContent = color.nombre;
        valueContainer.appendChild(nombre);

        optionsContainer
            .querySelectorAll(".color-option")
            .forEach((opcion) => {
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

    window.establecerColorProducto = function (nombreColor) {
        const colorEncontrado = colores.find(
            color => color.nombre === nombreColor
        );

        if (colorEncontrado) {
            seleccionarColor(colorEncontrado);
            return;
        }

        colorInput.value = nombreColor || "";

        valueContainer.replaceChildren();

        const nombre = document.createElement("span");
        nombre.textContent = nombreColor || "Seleccionar color";
        valueContainer.appendChild(nombre);

        optionsContainer
            .querySelectorAll(".color-option")
            .forEach(opcion => {
                opcion.setAttribute(
                    "aria-selected",
                    String(opcion.dataset.color === nombreColor)
                );
            });
    };

    colores.forEach((color) => {
        const opcion = document.createElement("button");
        opcion.type = "button";
        opcion.className = "color-option";
        opcion.setAttribute("role", "option");
        opcion.setAttribute("aria-selected", "false");
        opcion.dataset.color = color.nombre;

        opcion.appendChild(crearPunto(color));

        const nombre = document.createElement("span");
        nombre.textContent = color.nombre;
        opcion.appendChild(nombre);

        opcion.addEventListener("click", () => {
            seleccionarColor(color);
        });

        optionsContainer.appendChild(opcion);
    });

    trigger.addEventListener("click", () => {
        const estaAbierto = !optionsContainer.classList.contains("hidden");

        if (estaAbierto) {
            cerrarOpciones();
        } else {
            optionsContainer.classList.remove("hidden");
            trigger.setAttribute("aria-expanded", "true");
        }
    });

    document.addEventListener("click", (evento) => {
        if (!picker.contains(evento.target)) {
            cerrarOpciones();
        }
    });

    trigger.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            cerrarOpciones();
            trigger.focus();
        }
    });
});
