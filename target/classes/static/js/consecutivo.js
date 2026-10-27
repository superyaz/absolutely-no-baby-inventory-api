
document.addEventListener('DOMContentLoaded', () => {
    const grupo = document.getElementById('grupo');
    const tipo = document.getElementById('tipoProducto');
    const modelo = document.getElementById('modelo');
    const consecutivo = document.getElementById('consecutivo');
    const codigoPreview = document.getElementById('codigoPreview');

    let consultaActual = 0;

    function mostrarCodigo(codigo) {
        if (consecutivo) {
            consecutivo.value = codigo ? codigo.slice(-2) : '—';
        }

        if (codigoPreview) {
            codigoPreview.textContent = codigo || '————————';
        }
    }

    async function actualizarVistaPrevia() {

        if (window.productoEnEdicion) {
            return;
        }

        const numeroConsulta = ++consultaActual;

        const gg = grupo?.value?.trim() || '';
        const tt = tipo?.value?.trim() || '';
        const mm = modelo?.value?.trim() || '';

        if (
            !/^\d{2}$/.test(gg) ||
            !/^\d{2}$/.test(tt) ||
            !/^\d{2}$/.test(mm)
        ) {
            mostrarCodigo('');
            return;
        }

        const prefijo = gg + tt + mm;

        mostrarCodigo('');
        if (consecutivo) consecutivo.value = '...';
        if (codigoPreview) codigoPreview.textContent = `${prefijo}...`;

        try {
            const parametros = new URLSearchParams({
                grupo: gg,
                tipo: tt,
                modelo: mm
            });

            const respuesta = await fetch(
                `/api/productos/siguiente-codigo?${parametros.toString()}`
            );

            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                throw new Error(
                    resultado.message ||
                    resultado.mensaje ||
                    'No se pudo consultar el consecutivo.'
                );
            }

            if (numeroConsulta !== consultaActual) return;

            if (!resultado.codigoProducto) {
                throw new Error('El servidor no devolvió el código generado.');
            }

            mostrarCodigo(resultado.codigoProducto);

        } catch (error) {
            if (numeroConsulta !== consultaActual) return;

            if (consecutivo) consecutivo.value = '—';
            if (codigoPreview) codigoPreview.textContent = prefijo + '??';

            console.error('Error consultando el consecutivo:', error);
        }
    }

    grupo?.addEventListener('change', actualizarVistaPrevia);
    tipo?.addEventListener('change', actualizarVistaPrevia);
    modelo?.addEventListener('change', actualizarVistaPrevia);

    actualizarVistaPrevia();
});
