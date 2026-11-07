
package com.ANB.Models.Service;

import com.ANB.Models.DTO.CrearTransferenciaRequest;
import com.ANB.Models.DTO.RechazarTransferenciaRequest;
import com.ANB.Models.DTO.SucursalTransferenciaDTO;
import com.ANB.Models.DTO.TransferenciaContextoDTO;
import com.ANB.Models.DTO.TransferenciaDTO;
import com.ANB.Models.DTO.TransferenciaDetalleDTO;
import com.ANB.Models.DTO.TransferenciaVarianteDTO;

import com.ANB.Models.Entity.*;
import com.ANB.Models.Repository.*;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TransferenciaService {

        private static final String SOLICITADA = "SOLICITADA";
        private static final String EN_TRANSITO = "EN TRANSITO";
        private static final String RECIBIDA = "RECIBIDA";
        private static final String RECHAZADA = "RECHAZADA";

        private final TransferenciaRepository transferenciaRepository;
        private final DetalleTransferenciaRepository detalleRepository;
        private final InventarioRepository inventarioRepository;
        private final ProductoVarianteRepository varianteRepository;
        private final SucursalRepository sucursalRepository;
        private final UsuarioRepository usuarioRepository;

        public TransferenciaService(
                        TransferenciaRepository transferenciaRepository,
                        DetalleTransferenciaRepository detalleRepository,
                        InventarioRepository inventarioRepository,
                        ProductoVarianteRepository varianteRepository,
                        SucursalRepository sucursalRepository,
                        UsuarioRepository usuarioRepository) {

                this.transferenciaRepository = transferenciaRepository;
                this.detalleRepository = detalleRepository;
                this.inventarioRepository = inventarioRepository;
                this.varianteRepository = varianteRepository;
                this.sucursalRepository = sucursalRepository;
                this.usuarioRepository = usuarioRepository;
        }

        @Transactional(readOnly = true)
        public TransferenciaContextoDTO obtenerContexto(Long usuarioId) {

                Usuario usuario = obtenerUsuarioActivo(usuarioId);

                Sucursal destino = obtenerSucursalActiva(
                                usuario.getSucursal().getIdSucursal());

                List<SucursalTransferenciaDTO> origenes = sucursalRepository.findAll()
                                .stream()
                                .filter(sucursal -> Boolean.TRUE.equals(sucursal.getActivo()))
                                .filter(sucursal -> !sucursal.getIdSucursal().equals(
                                                destino.getIdSucursal()))
                                .sorted(Comparator.comparing(
                                                Sucursal::getNombre,
                                                String.CASE_INSENSITIVE_ORDER))
                                .map(sucursal -> new SucursalTransferenciaDTO(
                                                sucursal.getIdSucursal(),
                                                sucursal.getNombre(),
                                                sucursal.getCiudad()))
                                .toList();

                return new TransferenciaContextoDTO(
                                destino.getIdSucursal(),
                                destino.getNombre(),
                                destino.getCiudad(),
                                origenes);
        }

        @Transactional(readOnly = true)
        public List<TransferenciaDTO> listar(Long usuarioId) {

                Usuario usuario = obtenerUsuarioActivo(usuarioId);

                Long sucursalId = usuario.getSucursal().getIdSucursal();

                return transferenciaRepository
                                .buscarPorSucursal(
                                                sucursalId,
                                                PageRequest.of(0, 100))
                                .stream()
                                .map(transferencia -> convertirDTO(transferencia, sucursalId))
                                .toList();
        }

        @Transactional(readOnly = true)
        public TransferenciaDTO obtener(
                        Long transferenciaId,
                        Long usuarioId) {

                Usuario usuario = obtenerUsuarioActivo(usuarioId);

                Transferencia transferencia = transferenciaRepository.findById(transferenciaId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "No encontramos la transferencia solicitada."));

                validarParticipacion(transferencia, usuario);

                return convertirDTO(
                                transferencia,
                                usuario.getSucursal().getIdSucursal());
        }

        @Transactional(readOnly = true)
        public List<TransferenciaVarianteDTO> buscarVariantes(
                        Long usuarioId,
                        Long sucursalOrigenId,
                        String busqueda) {

                Usuario usuario = obtenerUsuarioActivo(usuarioId);

                Sucursal destino = obtenerSucursalActiva(
                                usuario.getSucursal().getIdSucursal());

                Sucursal origen = obtenerSucursalActiva(sucursalOrigenId);

                if (origen.getIdSucursal().equals(destino.getIdSucursal())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "La sucursal de origen debe ser diferente de tu sucursal actual.");
                }

                Map<Long, Integer> existencias = obtenerExistencias(origen.getIdSucursal());

                String termino = busqueda == null
                                ? ""
                                : busqueda.trim().toLowerCase(Locale.ROOT);

                return varianteRepository.findByActivoTrue()
                                .stream()
                                .filter(variante -> variante.getProducto() != null)
                                .filter(variante -> Boolean.TRUE.equals(
                                                variante.getProducto().getActivo()))
                                .map(variante -> new TransferenciaVarianteDTO(
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
                                .filter(variante -> variante.existenciaDisponible() > 0)
                                .filter(variante -> termino.isEmpty()
                                                || coincide(variante.codigoProducto(), termino)
                                                || coincide(variante.nombreProducto(), termino)
                                                || coincide(variante.codigoBarras(), termino)
                                                || coincide(variante.talla(), termino)
                                                || coincide(variante.color(), termino))
                                .sorted(Comparator.comparing(
                                                TransferenciaVarianteDTO::nombreProducto,
                                                String.CASE_INSENSITIVE_ORDER))
                                .limit(30)
                                .toList();
        }

        @Transactional
        public TransferenciaDTO solicitar(
                        CrearTransferenciaRequest request,
                        Long usuarioId) {

                Usuario solicitante = obtenerUsuarioActivo(usuarioId);

                Sucursal destino = obtenerSucursalActiva(
                                solicitante.getSucursal().getIdSucursal());

                Sucursal origen = obtenerSucursalActiva(
                                request.sucursalOrigenId());

                if (origen.getIdSucursal().equals(destino.getIdSucursal())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No puedes solicitar una transferencia a tu misma sucursal.");
                }

                if (request.detalles() == null
                                || request.detalles().isEmpty()) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Agrega al menos una variante a la transferencia.");
                }

                Map<Long, Integer> existencias = obtenerExistencias(origen.getIdSucursal());

                Set<Long> variantesIncluidas = new HashSet<>();

                List<ProductoVariante> variantes = new ArrayList<>();

                for (CrearTransferenciaRequest.Detalle linea : request.detalles()) {

                        if (linea == null
                                        || linea.productoVarianteId() == null
                                        || linea.cantidadSolicitada() == null
                                        || linea.cantidadSolicitada() <= 0) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "Cada prenda debe tener una variante y una cantidad mayor que cero.");
                        }

                        if (!variantesIncluidas.add(
                                        linea.productoVarianteId())) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "No repitas la misma variante. Modifica su cantidad en una sola línea.");
                        }

                        ProductoVariante variante = obtenerVarianteActiva(
                                        linea.productoVarianteId());

                        int disponible = existencias.getOrDefault(
                                        variante.getIdProductoVariante(),
                                        0);

                        if (linea.cantidadSolicitada() > disponible) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Stock insuficiente en " + origen.getNombre()
                                                                + " para " + describir(variante)
                                                                + ". Disponible: " + disponible + ".");
                        }

                        variantes.add(variante);
                }

                Transferencia transferencia = new Transferencia();

                transferencia.setFechaSolicitud(LocalDateTime.now());

                transferencia.setEstado(SOLICITADA);

                transferencia.setObservacion(
                                limpiar(request.observacion()));

                transferencia.setSucursalOrigen(origen);

                transferencia.setSucursalDestino(destino);

                transferencia.setUsuarioSolicitante(solicitante);

                transferencia.setUsuarioResponsable(null);

                transferencia = transferenciaRepository.saveAndFlush(transferencia);

                List<DetalleTransferencia> detalles = new ArrayList<>();

                for (int i = 0; i < request.detalles().size(); i++) {

                        CrearTransferenciaRequest.Detalle linea = request.detalles().get(i);

                        DetalleTransferencia detalle = new DetalleTransferencia();

                        detalle.setTransferencia(transferencia);

                        detalle.setProductoVariante(variantes.get(i));

                        detalle.setCantidadSolicitada(
                                        linea.cantidadSolicitada());

                        detalle.setCantidadAprobada(0);

                        detalles.add(detalle);
                }

                detalleRepository.saveAll(detalles);

                return convertirDTO(
                                transferencia,
                                destino.getIdSucursal());
        }

        @Transactional
        public TransferenciaDTO aprobar(
                        Long transferenciaId,
                        Long usuarioId) {

                Usuario responsable = obtenerUsuarioActivo(usuarioId);

                Transferencia transferencia = obtenerTransferenciaBloqueada(transferenciaId);

                validarSucursal(
                                responsable,
                                transferencia.getSucursalOrigen(),
                                "Solo la sucursal de origen puede aprobar esta transferencia.");

                validarEstado(
                                transferencia,
                                SOLICITADA,
                                "Solo se pueden aprobar transferencias que estén solicitadas.");

                List<DetalleTransferencia> detalles = detalleRepository.findByTransferencia_IdTransferencia(
                                transferenciaId);

                if (detalles.isEmpty()) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La transferencia no contiene prendas para aprobar.");
                }

                for (DetalleTransferencia detalle : detalles) {

                        ProductoVariante variante = detalle.getProductoVariante();

                        if (variante == null
                                        || !Boolean.TRUE.equals(variante.getActivo())
                                        || variante.getProducto() == null
                                        || !Boolean.TRUE.equals(
                                                        variante.getProducto().getActivo())) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Una de las variantes de la solicitud está inactiva.");
                        }

                        Inventario inventario = inventarioRepository.buscarParaActualizar(
                                        transferencia.getSucursalOrigen()
                                                        .getIdSucursal(),
                                        variante.getIdProductoVariante()).orElseThrow(
                                                        () -> new ResponseStatusException(
                                                                        HttpStatus.CONFLICT,
                                                                        "No existe inventario de origen para "
                                                                                        + describir(variante) + "."));

                        int disponible = inventario.getCantidad() == null
                                        ? 0
                                        : inventario.getCantidad();

                        int solicitado = detalle.getCantidadSolicitada() == null
                                        ? 0
                                        : detalle.getCantidadSolicitada();

                        if (solicitado <= 0 || disponible < solicitado) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Stock insuficiente para aprobar "
                                                                + describir(variante)
                                                                + ". Solicitado: " + solicitado
                                                                + ", disponible actualmente: "
                                                                + disponible + ".");
                        }

                        inventario.setCantidad(disponible - solicitado);

                        inventario.setFechaActualizacion(LocalDateTime.now());

                        inventarioRepository.save(inventario);

                        detalle.setCantidadAprobada(solicitado);
                }

                detalleRepository.saveAll(detalles);

                transferencia.setEstado(EN_TRANSITO);

                transferencia.setFechaRespuesta(LocalDateTime.now());

                transferencia.setUsuarioResponsable(responsable);

                Transferencia guardada = transferenciaRepository.save(transferencia);

                return convertirDTO(
                                guardada,
                                responsable.getSucursal().getIdSucursal());
        }

        @Transactional
        public TransferenciaDTO recibir(
                        Long transferenciaId,
                        Long usuarioId) {

                Usuario receptor = obtenerUsuarioActivo(usuarioId);

                Transferencia transferencia = obtenerTransferenciaBloqueada(transferenciaId);

                validarSucursal(
                                receptor,
                                transferencia.getSucursalDestino(),
                                "Solo la sucursal de destino puede recibir esta transferencia.");

                validarEstado(
                                transferencia,
                                EN_TRANSITO,
                                "Solo se pueden recibir transferencias que estén en tránsito.");

                List<DetalleTransferencia> detalles = detalleRepository.findByTransferencia_IdTransferencia(
                                transferenciaId);

                if (detalles.isEmpty()) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "La transferencia no contiene detalles para recibir.");
                }

                for (DetalleTransferencia detalle : detalles) {

                        ProductoVariante variante = detalle.getProductoVariante();

                        int cantidadRecibida = detalle.getCantidadAprobada() == null
                                        ? 0
                                        : detalle.getCantidadAprobada();

                        if (variante == null || cantidadRecibida <= 0) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Una de las líneas no tiene una cantidad aprobada válida.");
                        }

                        Inventario inventario = inventarioRepository.buscarParaActualizar(
                                        transferencia.getSucursalDestino()
                                                        .getIdSucursal(),
                                        variante.getIdProductoVariante()).orElseGet(
                                                        () -> crearInventarioDestino(
                                                                        transferencia.getSucursalDestino(),
                                                                        variante));

                        int existenciaActual = inventario.getCantidad() == null
                                        ? 0
                                        : inventario.getCantidad();

                        final int existenciaNueva;

                        try {

                                existenciaNueva = Math.addExact(
                                                existenciaActual,
                                                cantidadRecibida);

                        } catch (ArithmeticException ex) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "La cantidad recibida supera el límite permitido para "
                                                                + describir(variante) + ".");
                        }

                        inventario.setCantidad(existenciaNueva);

                        inventario.setFechaActualizacion(LocalDateTime.now());

                        inventarioRepository.save(inventario);
                }

                transferencia.setEstado(RECIBIDA);

                transferencia.setFechaRespuesta(LocalDateTime.now());

                Transferencia guardada = transferenciaRepository.save(transferencia);

                return convertirDTO(
                                guardada,
                                receptor.getSucursal().getIdSucursal());
        }

        @Transactional
        public TransferenciaDTO rechazar(
                        Long transferenciaId,
                        RechazarTransferenciaRequest request,
                        Long usuarioId) {

                Usuario responsable = obtenerUsuarioActivo(usuarioId);

                Transferencia transferencia = obtenerTransferenciaBloqueada(transferenciaId);

                validarSucursal(
                                responsable,
                                transferencia.getSucursalOrigen(),
                                "Solo la sucursal de origen puede rechazar esta transferencia.");

                validarEstado(
                                transferencia,
                                SOLICITADA,
                                "Solo se pueden rechazar transferencias que estén solicitadas.");

                String motivo = request.observacion().trim();

                String observacionActual = limpiar(transferencia.getObservacion());

                String observacionNueva = observacionActual.isEmpty()
                                ? "Rechazo: " + motivo
                                : observacionActual + "\nRechazo: " + motivo;

                if (observacionNueva.length() > 1000) {
                        observacionNueva = observacionNueva.substring(0, 1000);
                }

                transferencia.setObservacion(observacionNueva);

                transferencia.setEstado(RECHAZADA);

                transferencia.setFechaRespuesta(LocalDateTime.now());

                transferencia.setUsuarioResponsable(responsable);

                Transferencia guardada = transferenciaRepository.save(transferencia);

                return convertirDTO(
                                guardada,
                                responsable.getSucursal().getIdSucursal());
        }

        @Transactional(readOnly = true)
        public long contarPendientesAccion(Long usuarioId) {
                Usuario usuario = obtenerUsuarioActivo(usuarioId);
                Long sucursalId = usuario.getSucursal().getIdSucursal();
                return transferenciaRepository
                                .contarPendientesQueRequierenAccion(sucursalId);
        }

        private Usuario obtenerUsuarioActivo(Long usuarioId) {

                Usuario usuario = usuarioRepository.findById(usuarioId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "No se pudo identificar al usuario autenticado."));

                if (!Boolean.TRUE.equals(usuario.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario autenticado está inactivo.");
                }

                if (usuario.getSucursal() == null
                                || !Boolean.TRUE.equals(
                                                usuario.getSucursal().getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario no tiene una sucursal activa asignada.");
                }

                return usuario;
        }

        private Sucursal obtenerSucursalActiva(Long sucursalId) {

                if (sucursalId == null) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debes seleccionar una sucursal de origen.");
                }

                Sucursal sucursal = sucursalRepository.findById(sucursalId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "La sucursal seleccionada no existe."));

                if (!Boolean.TRUE.equals(sucursal.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "La sucursal seleccionada está inactiva.");
                }

                return sucursal;
        }

        private ProductoVariante obtenerVarianteActiva(Long varianteId) {

                ProductoVariante variante = varianteRepository.findById(varianteId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Una de las variantes seleccionadas ya no existe."));

                if (!Boolean.TRUE.equals(variante.getActivo())
                                || variante.getProducto() == null
                                || !Boolean.TRUE.equals(
                                                variante.getProducto().getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No puedes transferir una prenda o variante inactiva.");
                }

                return variante;
        }

        private Transferencia obtenerTransferenciaBloqueada(
                        Long transferenciaId) {

                return transferenciaRepository.buscarParaActualizar(
                                transferenciaId).orElseThrow(
                                                () -> new ResponseStatusException(
                                                                HttpStatus.NOT_FOUND,
                                                                "No encontramos la transferencia solicitada."));
        }

        private void validarParticipacion(
                        Transferencia transferencia,
                        Usuario usuario) {

                Long sucursalUsuario = usuario.getSucursal().getIdSucursal();

                boolean participa = sucursalUsuario.equals(
                                transferencia.getSucursalOrigen().getIdSucursal())
                                || sucursalUsuario.equals(
                                                transferencia.getSucursalDestino().getIdSucursal());

                if (!participa) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "No tienes acceso a una transferencia de otras sucursales.");
                }
        }

        private void validarSucursal(
                        Usuario usuario,
                        Sucursal sucursalPermitida,
                        String mensaje) {

                if (!usuario.getSucursal().getIdSucursal()
                                .equals(sucursalPermitida.getIdSucursal())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        mensaje);
                }
        }

        private void validarEstado(
                        Transferencia transferencia,
                        String estadoEsperado,
                        String mensaje) {

                if (!estadoEsperado.equals(transferencia.getEstado())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        mensaje);
                }
        }

        private Map<Long, Integer> obtenerExistencias(Long sucursalId) {

                Map<Long, Integer> existencias = new HashMap<>();

                for (Inventario inventario : inventarioRepository.findBySucursal_IdSucursal(
                                sucursalId)) {

                        if (inventario.getProductoVariante() != null) {

                                existencias.put(
                                                inventario.getProductoVariante()
                                                                .getIdProductoVariante(),
                                                inventario.getCantidad() == null
                                                                ? 0
                                                                : inventario.getCantidad());
                        }
                }

                return existencias;
        }

        private Inventario crearInventarioDestino(
                        Sucursal sucursal,
                        ProductoVariante variante) {

                Inventario inventario = new Inventario();

                inventario.setSucursal(sucursal);

                inventario.setProductoVariante(variante);

                inventario.setCantidad(0);

                inventario.setFechaActualizacion(LocalDateTime.now());

                return inventario;
        }

        private TransferenciaDTO convertirDTO(
                        Transferencia transferencia,
                        Long sucursalUsuarioId) {

                List<TransferenciaDetalleDTO> detalles = detalleRepository.findByTransferencia_IdTransferencia(
                                transferencia.getIdTransferencia())
                                .stream()
                                .map(this::convertirDetalleDTO)
                                .toList();

                boolean esOrigen = transferencia.getSucursalOrigen().getIdSucursal()
                                .equals(sucursalUsuarioId);

                boolean esDestino = transferencia.getSucursalDestino().getIdSucursal()
                                .equals(sucursalUsuarioId);

                boolean solicitada = SOLICITADA.equals(transferencia.getEstado());

                boolean enTransito = EN_TRANSITO.equals(transferencia.getEstado());

                String referencia = String.format(
                                Locale.ROOT,
                                "TRF-%d-%06d",
                                transferencia.getFechaSolicitud().getYear(),
                                transferencia.getIdTransferencia());

                return new TransferenciaDTO(

                                transferencia.getIdTransferencia(),

                                referencia,

                                transferencia.getFechaSolicitud(),

                                transferencia.getFechaRespuesta(),

                                transferencia.getEstado(),

                                transferencia.getObservacion(),

                                transferencia.getSucursalOrigen().getIdSucursal(),

                                transferencia.getSucursalOrigen().getNombre(),

                                transferencia.getSucursalOrigen().getCiudad(),

                                transferencia.getSucursalDestino().getIdSucursal(),

                                transferencia.getSucursalDestino().getNombre(),

                                transferencia.getSucursalDestino().getCiudad(),

                                nombreUsuario(transferencia.getUsuarioSolicitante()),

                                nombreUsuario(transferencia.getUsuarioResponsable()),

                                detalles,

                                esOrigen && solicitada,

                                esOrigen && solicitada,

                                esDestino && enTransito);
        }

        private TransferenciaDetalleDTO convertirDetalleDTO(
                        DetalleTransferencia detalle) {

                ProductoVariante variante = detalle.getProductoVariante();

                Producto producto = variante == null
                                ? null
                                : variante.getProducto();

                return new TransferenciaDetalleDTO(

                                detalle.getIdDetalleTransferencia(),

                                variante == null
                                                ? null
                                                : variante.getIdProductoVariante(),

                                producto == null
                                                ? ""
                                                : producto.getCodigoProducto(),

                                producto == null
                                                ? "Producto"
                                                : producto.getNombre(),

                                variante == null
                                                ? ""
                                                : variante.getCodigoBarras(),

                                variante == null
                                                ? ""
                                                : variante.getTalla(),

                                variante == null
                                                ? ""
                                                : variante.getColor(),

                                detalle.getCantidadSolicitada(),

                                detalle.getCantidadAprobada());
        }

        private String nombreUsuario(Usuario usuario) {

                if (usuario == null) {
                        return "—";
                }

                return (usuario.getNombre()
                                + " "
                                + usuario.getApellido()).trim();
        }

        private String describir(ProductoVariante variante) {

                return variante.getProducto().getNombre()
                                + " · " + variante.getTalla()
                                + " / " + variante.getColor()
                                + " (" + variante.getCodigoBarras() + ")";
        }

        private boolean coincide(String valor, String termino) {

                return valor != null
                                && valor.toLowerCase(Locale.ROOT).contains(termino);
        }

        private String limpiar(String texto) {

                return texto == null ? "" : texto.trim();
        }
}
