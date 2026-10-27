
document.addEventListener("DOMContentLoaded", () => {
  const grupo = document.getElementById("grupo");
  const tipo = document.getElementById("tipoProducto");
  const modelo = document.getElementById("modelo");
  const consecutivo = document.getElementById("consecutivo");
  const codigoPreview = document.getElementById("codigoPreview");

  function actualizarCodigoPreview() {
    const gg = grupo?.value?.trim() || "";
    const tt = tipo?.value?.trim() || "";
    const mm = modelo?.value?.trim() || "";

    let prefijo = "";

    if (/^\d{2}$/.test(gg)) {
      prefijo = gg;
    }

    if (prefijo && /^\d{2}$/.test(tt)) {
      prefijo += tt;
    }

    if (prefijo && /^\d{2}$/.test(mm) && prefijo.length === 4) {
      prefijo += mm;
    }

    if (prefijo.length < 6) {
      consecutivo.value = "—";
      codigoPreview.textContent = prefijo || "————————";
      return;
    }

    codigoPreview.textContent = `${prefijo}__`;
  }

  grupo?.addEventListener("change", actualizarCodigoPreview);
  tipo?.addEventListener("change", actualizarCodigoPreview);
  modelo?.addEventListener("change", actualizarCodigoPreview);

  actualizarCodigoPreview();
});
