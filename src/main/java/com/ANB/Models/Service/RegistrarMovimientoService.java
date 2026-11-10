package com.ANB.Models.Service;

import com.ANB.Models.DTO.MovimientoVarianteDTO;
import com.ANB.Models.DTO.RegistrarMovimientoRequest;
import com.ANB.Models.DTO.MovimientoHistorialDTO;
import com.ANB.Models.Entity.*;
import com.ANB.Models.Repository.*;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrarMovimientoService {

        private static final Set<String> TIPOS_PERMITIDOS = Set.of("ENT", "SAL", "AJU", "DEV");

        private final MovimientoRepository movimientoRepository;
        private final DetalleMovimientoRepository detalleMovimientoRepository;
        private final TipoMovimientoRepository tipoMovimientoRepository;
        private final InventarioRepository inventarioRepository;
        private final ProductoVarianteRepository varianteRepository;
        private final SucursalRepository sucursalRepository;
        private final UsuarioRepository usuarioRepository;
        private final ConsecutivoMovimientoRepository consecutivoRepository;

        public RegistrarMovimientoService(
                        MovimientoRepository movimientoRepository,
                        DetalleMovimientoRepository detalleMovimientoRepository,
                        TipoMovimientoRepository tipoMovimientoRepository,
                        InventarioRepository inventarioRepository,
                        ProductoVarianteRepository varianteRepository,
                        SucursalRepository sucursalRepository,
                        UsuarioRepository usuarioRepository,
                        ConsecutivoMovimientoRepository consecutivoRepository) {

                this.movimientoRepository = movimientoRepository;
                this.detalleMovimientoRepository = detalleMovimientoRepository;
                this.tipoMovimientoRepository = tipoMovimientoRepository;
                this.inventarioRepository = inventarioRepository;
                this.varianteRepository = varianteRepository;
                this.sucursalRepository = sucursalRepository;
                this.usuarioRepository = usuarioRepository;
                this.consecutivoRepository = consecutivoRepository;
        }

        @Transactional(readOnly = true)
        public List<MovimientoVarianteDTO> buscarVariantes(
                        Long usuarioAutenticadoId,
                        String busqueda) {

                Usuario usuario = usuarioRepository
                                .findById(usuarioAutenticadoId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "No se pudo identificar al usuario autenticado."));

                if (!Boolean.TRUE.equals(usuario.getActivo())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario está inactivo.");
                }

                Sucursal sucursal = usuario.getSucursal();

                if (sucursal == null
                                || !Boolean.TRUE.equals(sucursal.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario no tiene una sucursal activa asignada.");
                }

                Long sucursalId = sucursal.getIdSucursal();

                Map<Long, Integer> existencias = new HashMap<>();

                for (Inventario inventario : inventarioRepository.findBySucursal_IdSucursal(sucursalId)) {

                        if (inventario.getProductoVariante() != null) {
                                existencias.put(
                                                inventario.getProductoVariante()
                                                                .getIdProductoVariante(),
                                                inventario.getCantidad() == null
                                                                ? 0
                                                                : inventario.getCantidad());
                        }
                }

                String termino = busqueda == null
                                ? ""
                                : busqueda.trim().toLowerCase(Locale.ROOT);

                return varianteRepository.findByActivoTrue()
                                .stream()
                                .filter(variante -> variante.getProducto() != null)
                                .filter(variante -> !Boolean.FALSE.equals(
                                                variante.getProducto().getActivo()))
                                .filter(variante -> termino.isEmpty()
                                                || coincide(variante.getCodigoBarras(), termino)
                                                || coincide(variante.getTalla(), termino)
                                                || coincide(variante.getColor(), termino)
                                                || coincide(
                                                                variante.getProducto().getCodigoProducto(),
                                                                termino)
                                                || coincide(
                                                                variante.getProducto().getNombre(),
                                                                termino))
                                .map(variante -> new MovimientoVarianteDTO(
                                                variante.getIdProductoVariante(),
                                                variante.getProducto().getCodigoProducto(),
                                                variante.getProducto().getNombre(),
                                                variante.getCodigoBarras(),
                                                variante.getTalla(),
                                                variante.getColor(),
                                                variante.getPrecio(),
                                                existencias.getOrDefault(
                                                                variante.getIdProductoVariante(),
                                                                0)))
                                .limit(30)
                                .toList();
        }

        private boolean coincide(String valor, String termino) {
                return valor != null
                                && valor.toLowerCase(Locale.ROOT).contains(termino);
        }

        @Transactional
        public Movimiento registrar(
                        RegistrarMovimientoRequest request,
                        Long usuarioAutenticadoId) {

                String codigo = request.getCodigoTipoMovimiento()
                                .trim()
                                .toUpperCase(Locale.ROOT);

                if (!TIPOS_PERMITIDOS.contains(codigo)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "El tipo de movimiento no es válido.");
                }

                TipoMovimiento tipoMovimiento = tipoMovimientoRepository
                                .findByCodigoAndActivoTrue(codigo)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "El tipo " + codigo
                                                                + " no está registrado o está inactivo."));

                if (!Boolean.TRUE.equals(
                                tipoMovimiento.getAfectaInventario())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "El tipo no tiene habilitada la afectación de inventario.");
                }

                Usuario usuario = usuarioRepository
                                .findById(usuarioAutenticadoId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "No fue posible identificar al usuario autenticado."));

                if (!Boolean.TRUE.equals(usuario.getActivo())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario autenticado está inactivo.");
                }

                Sucursal sucursal = usuario.getSucursal();

                if (sucursal == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario no tiene una sucursal asignada.");
                }

                if (!Boolean.TRUE.equals(sucursal.getActivo())) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "La sucursal asignada al usuario está inactiva.");
                }

                String direccionDevolucion = request.getDireccionDevolucion() == null
                                ? ""
                                : request.getDireccionDevolucion()
                                                .trim()
                                                .toUpperCase(Locale.ROOT);

                if ("DEV".equals(codigo)
                                && !Set.of("ENTRADA", "SALIDA")
                                                .contains(direccionDevolucion)) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Selecciona si la devolución ingresa a la tienda "
                                                        + "o sale hacia el proveedor.");
                }

                Set<Long> variantesIncluidas = new HashSet<>();

                for (RegistrarMovimientoRequest.Detalle linea : request.getDetalles()) {

                        if (linea.getCantidad() == null) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "Todas las líneas deben tener una cantidad.");
                        }

                        if (!variantesIncluidas.add(
                                        linea.getProductoVarianteId())) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "No repitas la misma variante. "
                                                                + "Modifica su cantidad en una sola línea.");
                        }

                        if ("AJU".equals(codigo)) {

                                if (linea.getCantidad() == 0) {
                                        throw new ResponseStatusException(
                                                        HttpStatus.BAD_REQUEST,
                                                        "Un ajuste debe tener una diferencia "
                                                                        + "positiva o negativa distinta de cero.");
                                }

                        } else if (linea.getCantidad() <= 0) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "La cantidad debe ser mayor que cero.");
                        }
                }

                Movimiento movimiento = new Movimiento();

                movimiento.setFecha(LocalDateTime.now());
                movimiento.setEstado("APLICADO");
                movimiento.setReferencia(
                                generarReferencia(codigo));
                movimiento.setObservacion(limpiar(request.getObservacion()));
                movimiento.setTipoMovimiento(tipoMovimiento);
                movimiento.setSucursal(sucursal);
                movimiento.setUsuario(usuario);

                movimiento = movimientoRepository.saveAndFlush(movimiento);

                List<DetalleMovimiento> detalles = new ArrayList<>();

                for (RegistrarMovimientoRequest.Detalle linea : request.getDetalles()) {

                        ProductoVariante variante = varianteRepository.findById(
                                        linea.getProductoVarianteId()).orElseThrow(
                                                        () -> new ResponseStatusException(
                                                                        HttpStatus.BAD_REQUEST,
                                                                        "Una de las variantes seleccionadas "
                                                                                        + "ya no existe."));

                        if (Boolean.FALSE.equals(variante.getActivo())
                                        || variante.getProducto() == null
                                        || Boolean.FALSE.equals(
                                                        variante.getProducto().getActivo())) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "No puedes mover una prenda o variante inactiva.");
                        }

                        int delta = calcularDelta(
                                        codigo,
                                        direccionDevolucion,
                                        linea.getCantidad());

                        Inventario inventario = inventarioRepository
                                        .buscarParaActualizar(
                                                        sucursal.getIdSucursal(),
                                                        variante.getIdProductoVariante())
                                        .orElseGet(() -> crearInventarioInicial(sucursal, variante));

                        int existenciaAnterior = inventario.getCantidad() == null
                                        ? 0
                                        : inventario.getCantidad();

                        final int existenciaNueva;

                        try {
                                existenciaNueva = Math.addExact(
                                                existenciaAnterior,
                                                delta);
                        } catch (ArithmeticException ex) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "La cantidad supera el límite permitido.");
                        }

                        if (existenciaNueva < 0) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Stock insuficiente para "
                                                                + variante.getProducto().getNombre()
                                                                + " · talla " + variante.getTalla()
                                                                + " · color " + variante.getColor()
                                                                + ". Disponible: " + existenciaAnterior + ".");
                        }

                        inventario.setCantidad(existenciaNueva);
                        inventario.setFechaActualizacion(LocalDateTime.now());

                        inventarioRepository.save(inventario);

                        DetalleMovimiento detalle = new DetalleMovimiento();

                        detalle.setCantidad(delta);
                        detalle.setMovimiento(movimiento);
                        detalle.setProductoVariante(variante);

                        detalles.add(detalle);
                }

                detalleMovimientoRepository.saveAll(detalles);

                return movimiento;
        }

        @Transactional(readOnly = true)
        public String previsualizarReferencia(String codigo) {

                validarCodigoMovimiento(codigo);

                ConsecutivoMovimiento consecutivo = consecutivoRepository.findById(codigo)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.INTERNAL_SERVER_ERROR,
                                                "No existe el contador para " + codigo));

                long siguiente = Math.addExact(
                                consecutivo.getUltimoNumero(),
                                1L);

                return codigo + "-" + String.format("%03d", siguiente);
        }

        private String generarReferencia(String codigo) {

                validarCodigoMovimiento(codigo);

                ConsecutivoMovimiento consecutivo = consecutivoRepository.buscarBloqueado(codigo)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.INTERNAL_SERVER_ERROR,
                                                "No existe el contador para " + codigo));

                long siguiente;

                try {

                        siguiente = Math.addExact(
                                        consecutivo.getUltimoNumero(),
                                        1L);

                } catch (ArithmeticException ex) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Se agotó el consecutivo de movimientos.");
                }

                consecutivo.setUltimoNumero(siguiente);

                consecutivoRepository.save(consecutivo);

                return codigo + "-" + String.format("%03d", siguiente);
        }

        private void validarCodigoMovimiento(String codigo) {

                if (!TIPOS_PERMITIDOS.contains(codigo)) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Tipo de movimiento inválido.");
                }
        }

        @Transactional(readOnly = true)
        public List<MovimientoHistorialDTO> listarHistorial(
                        Long usuarioAutenticadoId) {

                Usuario usuario = usuarioRepository
                                .findById(usuarioAutenticadoId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "No se pudo identificar al usuario autenticado."));

                if (!Boolean.TRUE.equals(usuario.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario está inactivo.");
                }

                Sucursal sucursal = usuario.getSucursal();

                if (sucursal == null
                                || !Boolean.TRUE.equals(sucursal.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario no tiene una sucursal activa.");
                }

                return movimientoRepository
                                .findTop100BySucursal_IdSucursalOrderByFechaDesc(
                                                sucursal.getIdSucursal())
                                .stream()
                                .map(movimiento -> {

                                        List<DetalleMovimiento> lineas = detalleMovimientoRepository
                                                        .findByMovimiento_IdMovimiento(
                                                                        movimiento.getIdMovimiento());

                                        int unidades = lineas.stream()
                                                        .mapToInt(linea -> Math.abs(
                                                                        linea.getCantidad() == null
                                                                                        ? 0
                                                                                        : linea.getCantidad()))
                                                        .sum();

                                        String detalle = lineas.stream()
                                                        .map(linea -> {

                                                                ProductoVariante variante = linea.getProductoVariante();

                                                                if (variante == null
                                                                                || variante.getProducto() == null) {
                                                                        return "Variante";
                                                                }

                                                                int cantidad = linea.getCantidad() == null
                                                                                ? 0
                                                                                : linea.getCantidad();

                                                                String signo = cantidad > 0 ? "+" : "";

                                                                return variante.getProducto().getNombre()
                                                                                + " · " + variante.getTalla()
                                                                                + " / " + variante.getColor()
                                                                                + " (" + signo + cantidad + ")";
                                                        })
                                                        .reduce((a, b) -> a + " · " + b)
                                                        .orElse("Sin detalle");

                                        String nombreUsuario = movimiento.getUsuario() == null
                                                        ? "—"
                                                        : (movimiento.getUsuario().getNombre()
                                                                        + " "
                                                                        + movimiento.getUsuario().getApellido()).trim();

                                        return new MovimientoHistorialDTO(
                                                        movimiento.getIdMovimiento(),
                                                        movimiento.getFecha(),
                                                        movimiento.getTipoMovimiento() == null
                                                                        ? ""
                                                                        : movimiento.getTipoMovimiento().getCodigo(),
                                                        movimiento.getTipoMovimiento() == null
                                                                        ? "Movimiento"
                                                                        : movimiento.getTipoMovimiento().getNombre(),
                                                        movimiento.getSucursal() == null
                                                                        ? "—"
                                                                        : movimiento.getSucursal().getNombre(),
                                                        nombreUsuario,
                                                        unidades,
                                                        detalle,
                                                        movimiento.getReferencia(),
                                                        movimiento.getObservacion(),
                                                        movimiento.getEstado());

                                })
                                .toList();
        }

        private Inventario crearInventarioInicial(
                        Sucursal sucursal,
                        ProductoVariante variante) {

                Inventario inventario = new Inventario();

                inventario.setSucursal(sucursal);
                inventario.setProductoVariante(variante);
                inventario.setCantidad(0);
                inventario.setStockMinimo(3);
                inventario.setFechaActualizacion(LocalDateTime.now());

                return inventario;
        }

        private int calcularDelta(
                        String codigo,
                        String direccionDevolucion,
                        int cantidad) {

                return switch (codigo) {

                        case "ENT" -> cantidad;

                        case "SAL" -> -cantidad;

                        case "AJU" -> cantidad;

                        case "DEV" ->
                                "ENTRADA".equals(direccionDevolucion)
                                                ? cantidad
                                                : -cantidad;

                        default -> throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Tipo de movimiento no soportado.");
                };
        }

        private String limpiar(String texto) {
                return texto == null || texto.isBlank()
                                ? null
                                : texto.trim();
        }
}