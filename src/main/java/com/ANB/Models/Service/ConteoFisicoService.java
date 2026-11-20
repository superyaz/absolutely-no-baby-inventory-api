package com.ANB.Models.Service;

import com.ANB.Models.DTO.ConteoFisicoDTO;
import com.ANB.Models.DTO.RegistrarMovimientoRequest;
import com.ANB.Models.Entity.*;
import com.ANB.Models.Repository.*;

import java.time.LocalDateTime;
import java.util.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConteoFisicoService {

        private static final String EN_PROCESO = "EN PROCESO";
        private static final String POR_APROBAR = "POR APROBAR";
        private static final String COMPLETADO = "COMPLETADO";

        private static final Set<String> ROLES_APROBADORES = Set.of(
                        "AUXILIAR_INVENTARIO",
                        "ENCARGADO_SUCURSAL");

        private final ConteoFisicoRepository conteoRepository;
        private final DetalleConteoRepository detalleRepository;
        private final UsuarioRepository usuarioRepository;
        private final ProductoVarianteRepository varianteRepository;
        private final InventarioRepository inventarioRepository;
        private final RegistrarMovimientoService movimientoService;
        private final AuditoriaRepository auditoriaRepository;

        public ConteoFisicoService(
                        ConteoFisicoRepository conteoRepository,
                        DetalleConteoRepository detalleRepository,
                        UsuarioRepository usuarioRepository,
                        ProductoVarianteRepository varianteRepository,
                        InventarioRepository inventarioRepository,
                        RegistrarMovimientoService movimientoService,
                        AuditoriaRepository auditoriaRepository) {
                this.conteoRepository = conteoRepository;
                this.detalleRepository = detalleRepository;
                this.usuarioRepository = usuarioRepository;
                this.varianteRepository = varianteRepository;
                this.inventarioRepository = inventarioRepository;
                this.movimientoService = movimientoService;
                this.auditoriaRepository = auditoriaRepository;
        }

        @Transactional(readOnly = true)
        public List<ConteoFisicoDTO.Resumen> listar(Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);

                Long sucursalId = sucursalActiva(usuario).getIdSucursal();

                return conteoRepository
                                .findBySucursal_IdSucursalOrderByFechaInicioDesc(sucursalId)
                                .stream()
                                .map(this::resumen)
                                .toList();
        }

        @Transactional(readOnly = true)
        public ConteoFisicoDTO.Consulta obtener(
                        Long id,
                        Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);

                ConteoFisico conteo = buscarConteoSucursal(
                                id,
                                sucursalActiva(usuario).getIdSucursal());

                List<ConteoFisicoDTO.Detalle> detalles = detalleRepository
                                .findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(id)
                                .stream()
                                .map(this::convertirDetalle)
                                .toList();

                return new ConteoFisicoDTO.Consulta(
                                resumen(conteo),
                                detalles);
        }

        @Transactional
        public ConteoFisicoDTO.Resumen crear(
                        ConteoFisicoDTO.CrearRequest request,
                        Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);
                Sucursal sucursal = sucursalActiva(usuario);

                // 1. Obtener todas las variantes activas
                // cuyos productos también estén activos.
                List<ProductoVariante> variantes = varianteRepository
                                .findByActivoTrue()
                                .stream()
                                .filter(variante -> variante.getProducto() != null
                                                && Boolean.TRUE.equals(
                                                                variante.getProducto().getActivo()))
                                .sorted(
                                                Comparator.comparing(
                                                                (ProductoVariante variante) -> variante.getProducto()
                                                                                .getNombre(),
                                                                String.CASE_INSENSITIVE_ORDER).thenComparing(
                                                                                ProductoVariante::getTalla,
                                                                                String.CASE_INSENSITIVE_ORDER)
                                                                .thenComparing(
                                                                                ProductoVariante::getColor,
                                                                                String.CASE_INSENSITIVE_ORDER))
                                .toList();

                // 2. Consultar las existencias de la sucursal.
                Map<Long, Integer> existenciasPorVariante = new HashMap<>();

                List<Inventario> inventarios = inventarioRepository.findBySucursal_IdSucursal(
                                sucursal.getIdSucursal());

                for (Inventario inventario : inventarios) {

                        if (inventario.getProductoVariante() == null) {
                                continue;
                        }

                        existenciasPorVariante.put(
                                        inventario.getProductoVariante()
                                                        .getIdProductoVariante(),
                                        inventario.getCantidad() == null
                                                        ? 0
                                                        : inventario.getCantidad());
                }

                // 3. Crear la cabecera del conteo.
                ConteoFisico conteo = new ConteoFisico();

                conteo.setFechaInicio(LocalDateTime.now());
                conteo.setEstado(EN_PROCESO);

                conteo.setObservacion(
                                limpiar(request == null ? null : request.observacion()));

                conteo.setSucursal(sucursal);
                conteo.setUsuario(usuario);

                conteo = conteoRepository.save(conteo);

                // 4. Crear automáticamente un detalle por cada variante.
                List<DetalleConteo> detallesIniciales = new ArrayList<>();

                for (ProductoVariante variante : variantes) {

                        DetalleConteo detalle = new DetalleConteo();

                        detalle.setConteoFisico(conteo);
                        detalle.setProductoVariante(variante);

                        int cantidadSistema = existenciasPorVariante.getOrDefault(
                                        variante.getIdProductoVariante(),
                                        0);

                        // Fotografía inicial del inventario.
                        detalle.setCantidadSistema(cantidadSistema);

                        // Todavía no se ha realizado el conteo físico.
                        detalle.setCantidadFisica(0);
                        detalle.setDiferencia(0);
                        detalle.setContado(false);
                        detalle.setMotivo(null);

                        detallesIniciales.add(detalle);
                }

                // 5. Guardar todos los detalles en una sola operación.
                detalleRepository.saveAll(detallesIniciales);

                // 6. Registrar auditoría.
                registrarAuditoria(
                                "CREAR",
                                conteo,
                                usuario,
                                "Se creó una sesión de conteo físico para la sucursal "
                                                + sucursal.getNombre()
                                                + " con "
                                                + detallesIniciales.size()
                                                + " variantes precargadas.");

                return resumen(conteo);
        }

        @Transactional
        public ConteoFisicoDTO.Consulta guardarDetalle(
                        Long conteoId,
                        ConteoFisicoDTO.DetalleRequest request,
                        Long usuarioId) {

                if (request == null) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debes proporcionar los datos de la variante.");
                }

                return guardarDetalles(
                                conteoId,
                                new ConteoFisicoDTO.DetalleLoteRequest(
                                                Collections.singletonList(request)),
                                usuarioId);
        }

        @Transactional
        public ConteoFisicoDTO.Consulta guardarDetalles(
                        Long conteoId,
                        ConteoFisicoDTO.DetalleLoteRequest request,
                        Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);

                ConteoFisico conteo = buscarConteoSucursal(
                                conteoId,
                                sucursalActiva(usuario).getIdSucursal());

                exigirEstado(
                                conteo,
                                EN_PROCESO,
                                "Solo puedes modificar un conteo en proceso.");

                // Validar la solicitud.
                if (request == null
                                || request.detalles() == null
                                || request.detalles().isEmpty()) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Debes enviar al menos una cantidad física.");
                }

                // Obtener todos los detalles precargados de esta sesión.
                List<DetalleConteo> detallesExistentes = detalleRepository
                                .findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(
                                                conteoId);

                // Crear un mapa para localizar rápidamente cada variante.
                Map<Long, DetalleConteo> detallesPorVariante = new HashMap<>();

                for (DetalleConteo detalle : detallesExistentes) {

                        detallesPorVariante.put(
                                        detalle.getProductoVariante()
                                                        .getIdProductoVariante(),
                                        detalle);
                }

                Set<Long> variantesRecibidas = new HashSet<>();

                List<DetalleConteo> detallesActualizados = new ArrayList<>();

                // Validar y actualizar cada cantidad recibida.
                for (ConteoFisicoDTO.DetalleRequest linea : request.detalles()) {

                        if (linea == null
                                        || linea.productoVarianteId() == null
                                        || linea.cantidadFisica() == null
                                        || linea.cantidadFisica() < 0) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "Todas las variantes deben tener una cantidad "
                                                                + "física entera igual o mayor que cero.");
                        }

                        if (linea.motivo() != null
                                        && linea.motivo().length() > 1000) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "El motivo no puede superar los 1.000 caracteres.");
                        }

                        Long varianteId = linea.productoVarianteId();

                        // Evitar variantes duplicadas en una misma petición.
                        if (!variantesRecibidas.add(varianteId)) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "La solicitud contiene una variante duplicada.");
                        }

                        // La variante debe pertenecer al conteo precargado.
                        DetalleConteo detalle = detallesPorVariante.get(varianteId);

                        if (detalle == null) {
                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "La variante "
                                                                + varianteId
                                                                + " no pertenece a este conteo físico.");
                        }

                        int cantidadSistema = detalle.getCantidadSistema() == null
                                        ? 0
                                        : detalle.getCantidadSistema();

                        // Actualizar cantidad física.
                        detalle.setCantidadFisica(linea.cantidadFisica());

                        // Calcular diferencia.
                        detalle.setDiferencia(
                                        linea.cantidadFisica() - cantidadSistema);

                        // Guardar motivo.
                        detalle.setMotivo(limpiar(linea.motivo()));

                        // Marcar como contada, incluso cuando la cantidad sea cero.
                        detalle.setContado(true);

                        detallesActualizados.add(detalle);
                }

                // Guardar todos los detalles juntos.
                detalleRepository.saveAll(detallesActualizados);

                // Devolver el conteo actualizado.
                return obtener(conteoId, usuarioId);
        }

        @Transactional
        public ConteoFisicoDTO.Resumen finalizar(
                        Long conteoId,
                        Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);

                ConteoFisico conteo = buscarConteoSucursal(
                                conteoId,
                                sucursalActiva(usuario).getIdSucursal());

                exigirEstado(
                                conteo,
                                EN_PROCESO,
                                "Este conteo ya no está en proceso.");

                // Obtener todas las variantes que se cargaron
                // cuando comenzó este conteo.
                List<DetalleConteo> detalles = detalleRepository
                                .findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(
                                                conteoId);

                int total = detalles.size();

                int contadas = (int) detalles.stream()
                                .filter(detalle -> Boolean.TRUE.equals(detalle.getContado()))
                                .count();

                if (total == 0 || contadas < total) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Aún faltan variantes por contar. Registradas: "
                                                        + contadas
                                                        + " de "
                                                        + total
                                                        + ".");
                }

                conteo.setEstado(POR_APROBAR);

                conteoRepository.save(conteo);

                registrarAuditoria(
                                "ENVIAR_A_APROBACION",
                                conteo,
                                usuario,
                                "El conteo fue finalizado y quedó pendiente de aprobación.");

                return resumen(conteo);
        }

        @Transactional
        public ConteoFisicoDTO.Resumen aplicar(
                        Long conteoId,
                        Long usuarioId) {

                Usuario aprobador = usuarioActivo(usuarioId);

                validarAprobador(aprobador);

                ConteoFisico conteo = buscarConteoSucursal(
                                conteoId,
                                sucursalActiva(aprobador).getIdSucursal());

                exigirEstado(
                                conteo,
                                POR_APROBAR,
                                "El conteo debe estar pendiente de aprobación.");

                List<DetalleConteo> detalles = detalleRepository
                                .findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(
                                                conteoId);

                if (detalles.isEmpty()
                                || detalles.stream().anyMatch(
                                                detalle -> !Boolean.TRUE.equals(detalle.getContado()))) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "No se puede aplicar el conteo porque todavía "
                                                        + "existen variantes pendientes de contar.");
                }

                for (DetalleConteo detalle : detalles) {

                        Inventario actual = inventarioRepository.buscarParaActualizar(
                                        conteo.getSucursal().getIdSucursal(),
                                        detalle.getProductoVariante().getIdProductoVariante()).orElse(null);

                        int existenciaActual = actual == null
                                        || actual.getCantidad() == null
                                                        ? 0
                                                        : actual.getCantidad();

                        if (existenciaActual != detalle.getCantidadSistema()) {

                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "La existencia de "
                                                                + detalle.getProductoVariante()
                                                                                .getProducto().getNombre()
                                                                + " cambió desde el conteo. Actualiza esa "
                                                                + "variante antes de aprobar.");
                        }
                }

                List<RegistrarMovimientoRequest.Detalle> ajustes = new ArrayList<>();

                for (DetalleConteo detalle : detalles) {

                        int diferencia = detalle.getCantidadFisica()
                                        - detalle.getCantidadSistema();

                        if (diferencia != 0) {

                                RegistrarMovimientoRequest.Detalle linea = new RegistrarMovimientoRequest.Detalle();

                                linea.setProductoVarianteId(
                                                detalle.getProductoVariante()
                                                                .getIdProductoVariante());

                                linea.setCantidad(diferencia);

                                ajustes.add(linea);
                        }
                }

                if (!ajustes.isEmpty()) {

                        RegistrarMovimientoRequest movimiento = new RegistrarMovimientoRequest();

                        movimiento.setCodigoTipoMovimiento("AJU");

                        movimiento.setObservacion(
                                        "Ajuste por conteo físico "
                                                        + referencia(conteo)
                                                        + (conteo.getObservacion() == null
                                                                        ? ""
                                                                        : " · " + conteo.getObservacion()));

                        movimiento.setDetalles(ajustes);

                        movimientoService.registrar(
                                        movimiento,
                                        aprobador.getIdUsuario());
                }

                conteo.setEstado(COMPLETADO);
                conteo.setFechaFin(LocalDateTime.now());

                conteoRepository.save(conteo);

                registrarAuditoria(
                                "APROBAR_Y_APLICAR",
                                conteo,
                                aprobador,
                                "Se aplicaron " + ajustes.size()
                                                + " ajustes de inventario desde el conteo físico.");

                return resumen(conteo);
        }

        private ConteoFisicoDTO.Resumen resumen(ConteoFisico conteo) {

                List<DetalleConteo> detalles = detalleRepository
                                .findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(
                                                conteo.getIdConteoFisico());

                int total = detalles.size();

                int contadas = (int) detalles.stream()
                                .filter(detalle -> Boolean.TRUE.equals(detalle.getContado()))
                                .count();

                int porcentaje = total == 0
                                ? 0
                                : Math.min(
                                                100,
                                                (int) Math.round(contadas * 100.0 / total));

                int diferencias = 0;
                int sobrantes = 0;
                int faltantes = 0;

                for (DetalleConteo detalle : detalles) {

                        int delta = detalle.getDiferencia() == null
                                        ? 0
                                        : detalle.getDiferencia();

                        if (delta != 0) {
                                diferencias++;
                        }

                        if (delta > 0) {
                                sobrantes += delta;
                        }

                        if (delta < 0) {
                                faltantes += Math.abs(delta);
                        }
                }

                String responsable = conteo.getUsuario() == null
                                ? "—"
                                : (conteo.getUsuario().getNombre()
                                                + " "
                                                + conteo.getUsuario().getApellido()).trim();

                return new ConteoFisicoDTO.Resumen(
                                conteo.getIdConteoFisico(),
                                referencia(conteo),
                                conteo.getSucursal().getNombre(),
                                conteo.getEstado(),
                                conteo.getFechaInicio(),
                                conteo.getFechaFin(),
                                responsable,
                                conteo.getObservacion(),
                                total,
                                contadas,
                                porcentaje,
                                diferencias,
                                sobrantes,
                                faltantes);
        }

        private ConteoFisicoDTO.Detalle convertirDetalle(
                        DetalleConteo detalle) {

                ProductoVariante variante = detalle.getProductoVariante();

                Producto producto = variante == null
                                ? null
                                : variante.getProducto();

                return new ConteoFisicoDTO.Detalle(
                                detalle.getIdDetalleConteo(),
                                variante == null ? null
                                                : variante.getIdProductoVariante(),
                                producto == null ? ""
                                                : producto.getCodigoProducto(),
                                producto == null ? "Producto"
                                                : producto.getNombre(),
                                variante == null ? ""
                                                : variante.getCodigoBarras(),
                                variante == null ? ""
                                                : variante.getTalla(),
                                variante == null ? ""
                                                : variante.getColor(),
                                detalle.getCantidadSistema(),
                                detalle.getCantidadFisica(),
                                detalle.getDiferencia(),
                                detalle.getMotivo(),
                                Boolean.TRUE.equals(detalle.getContado()));
        }

        private Usuario usuarioActivo(Long id) {

                Usuario usuario = usuarioRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "No se pudo identificar al usuario autenticado."));

                if (!Boolean.TRUE.equals(usuario.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario está inactivo.");
                }

                return usuario;
        }

        private Sucursal sucursalActiva(Usuario usuario) {

                Sucursal sucursal = usuario.getSucursal();

                if (sucursal == null
                                || !Boolean.TRUE.equals(sucursal.getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "El usuario no tiene una sucursal activa asignada.");
                }

                return sucursal;
        }

        private void validarAprobador(Usuario usuario) {

                String rol = usuario.getRol() == null
                                ? ""
                                : usuario.getRol().getNombre();

                rol = rol == null
                                ? ""
                                : rol.trim().toUpperCase(Locale.ROOT);

                if (!ROLES_APROBADORES.contains(rol)) {

                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Tu rol no está autorizado para aprobar y aplicar "
                                                        + "ajustes de conteo físico.");
                }
        }

        private ConteoFisico buscarConteoSucursal(
                        Long id,
                        Long sucursalId) {

                return conteoRepository
                                .findByIdConteoFisicoAndSucursal_IdSucursal(
                                                id,
                                                sucursalId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "No se encontró el conteo en tu sucursal."));
        }

        private void exigirEstado(
                        ConteoFisico conteo,
                        String esperado,
                        String mensaje) {

                if (!esperado.equals(conteo.getEstado())) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        mensaje);
                }
        }

        private String referencia(ConteoFisico conteo) {

                return "CON-"
                                + conteo.getFechaInicio().getYear()
                                + "-"
                                + String.format("%03d", conteo.getIdConteoFisico());
        }

        private String limpiar(String valor) {

                return valor == null || valor.isBlank()
                                ? null
                                : valor.trim();
        }

        private void registrarAuditoria(
                        String accion,
                        ConteoFisico conteo,
                        Usuario usuario,
                        String descripcion) {

                Auditoria auditoria = new Auditoria();

                auditoria.setFecha(LocalDateTime.now());
                auditoria.setModulo("CONTEO FISICO");
                auditoria.setAccion(accion);
                auditoria.setEntidad("conteo_fisico");
                auditoria.setEntidadId(
                                String.valueOf(conteo.getIdConteoFisico()));
                auditoria.setDescripcion(descripcion);
                auditoria.setSucursal(conteo.getSucursal());
                auditoria.setUsuario(usuario);

                auditoriaRepository.save(auditoria);
        }
}