
document.addEventListener("DOMContentLoaded", () => {
    const modeloSelect = document.getElementById("modelo");
    const tallaSelect = document.getElementById("talla");

    const tallasPorModelo = {
        "01": ["RN", "0M", "0-3M"],
        "02": ["3M", "3-6M", "6M"],
        "03": ["6M", "6-9M", "9M"],
        "04": ["9M", "9-12M", "12M"]
    };

    function actualizarTallas(tallaSeleccionada = "") {
        if (!modeloSelect || !tallaSelect) return;

        const modelo = modeloSelect.value;
        const tallas = tallasPorModelo[modelo];

        tallaSelect.replaceChildren();

        if (!modelo || !tallas) {
            tallaSelect.add(
                new Option("Primero seleccione un modelo", "")
            );
            tallaSelect.disabled = true;
            return;
        }

        tallaSelect.add(
            new Option("Seleccione una talla", "")
        );

        tallas.forEach(talla => {
            tallaSelect.add(new Option(talla, talla));
        });


        tallaSelect.disabled = false;


        if (tallaSeleccionada) {
            const valorTalla = String(tallaSeleccionada).trim();

            tallaSelect.value = valorTalla;


            tallaSelect.dispatchEvent(
                new Event("input", { bubbles: true })
            );

            tallaSelect.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        }
    }

    window.actualizarTallasProducto = actualizarTallas;

    modeloSelect?.addEventListener("change", () => {
        actualizarTallas();
    });

    actualizarTallas();
});
