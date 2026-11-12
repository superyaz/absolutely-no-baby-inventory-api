window.TALLAS_POR_MODELO = Object.freeze({
    "01": [
        "RN",
        "0M",
        "0-3M",
        "3M",
        "3-6M",
        "6M",
        "6-9M",
        "9M",
        "9-12M",
        "12M"
    ],
    "02": [
        "1A",
        "2A",
        "3A",
        "4A"
    ],
    "03": [
        "5A",
        "6A",
        "7A",
        "8A",
        "9A",
        "10A"
    ],
    "04": [
        "11A",
        "12A",
        "13A",
        "14A",
        "15A",
        "16A"
    ]
});
document.addEventListener("DOMContentLoaded", () => {
    const modeloSelect = document.getElementById("modelo");
    const tallaSelect = document.getElementById("talla");
    if (!modeloSelect || !tallaSelect) return;
    function actualizarTallas(tallaSeleccionada = "") {
        const codigoModelo = String(
            modeloSelect.value || ""
        ).trim();
        const tallas =
            window.TALLAS_POR_MODELO[codigoModelo] || [];
        const valorGuardado = String(
            tallaSeleccionada ?? ""
        ).trim();
        tallaSelect.replaceChildren();
        if (!codigoModelo) {
            tallaSelect.add(
                new Option("Primero seleccione un modelo", "")
            );
            tallaSelect.disabled = true;
        }
        else if (tallas.length === 0) {
            tallaSelect.add(
                new Option(
                    "No hay tallas configuradas para este modelo",
                    ""
                )
            );
            tallaSelect.disabled = true;
        }
        else {
            tallaSelect.add(
                new Option("Seleccione una talla", "")
            );
            tallas.forEach(talla => {
                tallaSelect.add(
                    new Option(talla, talla)
                );
            });
            tallaSelect.disabled = false;
            if (valorGuardado && tallas.includes(valorGuardado)) {
                tallaSelect.value = valorGuardado;
            } else if (valorGuardado) {
                console.warn(
                    `La talla guardada "${valorGuardado}" ` +
                    `no pertenece al modelo ${codigoModelo}.`
                );
            }
        }
        tallaSelect.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }
    window.actualizarTallasProducto = (
        tallaSeleccionada = ""
    ) => {
        actualizarTallas(tallaSeleccionada);
    };
    modeloSelect.addEventListener("change", () => {
        actualizarTallas();
    });
    actualizarTallas();
});
