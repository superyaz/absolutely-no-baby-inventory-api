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

                ConteoFisico conteo = new ConteoFisico();

                conteo.setFechaInicio(LocalDateTime.now());
                conteo.setEstado(EN_PROCESO);
                conteo.setObservacion(
                                limpiar(request == null ? null : request.observacion()));
                conteo.setSucursal(sucursal);
                conteo.setUsuario(usuario);

                conteo = conteoRepository.save(conteo);

                registrarAuditoria(
                                "CREAR",
                                conteo,
                                usuario,
                                "Se creó una sesión de conteo físico para la sucursal "
                                                + sucursal.getNombre() + ".");

                return resumen(conteo);
        }

        @Transactional
        public ConteoFisicoDTO.Consulta guardarDetalle(
                        Long conteoId,
                        ConteoFisicoDTO.DetalleRequest request,
                        Long usuarioId) {

                Usuario usuario = usuarioActivo(usuarioId);

                ConteoFisico conteo = buscarConteoSucursal(
                                conteoId,
                                sucursalActiva(usuario).getIdSucursal());

                exigirEstado(
                                conteo,
                                EN_PROCESO,
                                "Solo puedes modificar un conteo en proceso.");

                if (request == null
                                || request.productoVarianteId() == null
                                || request.cantidadFisica() == null
                                || request.cantidadFisica() < 0) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Selecciona una variante e ingresa una cantidad física "
                                                        + "igual o mayor que cero.");
                }

                ProductoVariante variante = varianteRepository
                                .findById(request.productoVarianteId())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "La variante seleccionada no existe."));

                if (!Boolean.TRUE.equals(variante.getActivo())
                                || variante.getProducto() == null
                                || !Boolean.TRUE.equals(variante.getProducto().getActivo())) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "No puedes contar una prenda o variante inactiva.");
                }

                DetalleConteo detalle = detalleRepository
                                .findByConteoFisico_IdConteoFisicoAndProductoVariante_IdProductoVariante(
                                                conteoId,
                                                variante.getIdProductoVariante())
                                .orElseGet(DetalleConteo::new);

                if (detalle.getIdDetalleConteo() == null) {

                        detalle.setConteoFisico(conteo);
                        detalle.setProductoVariante(variante);

                        Inventario inventario = inventarioRepository
                                        .buscarParaActualizar(
                                                        conteo.getSucursal().getIdSucursal(),
                                                        variante.getIdProductoVariante())
                                        .orElse(null);

                        detalle.setCantidadSistema(
                                        inventario == null || inventario.getCantidad() == null
                                                        ? 0
                                                        : inventario.getCantidad());
                }

                detalle.setCantidadFisica(request.cantidadFisica());

                detalle.setDiferencia(
                                request.cantidadFisica() - detalle.getCantidadSistema());

                detalle.setMotivo(limpiar(request.motivo()));

                detalleRepository.save(detalle);

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

                int total = contarVariantesActivas();

                int contadas = (int) detalleRepository
                                .countByConteoFisico_IdConteoFisico(conteoId);

                if (total == 0 || contadas < total) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Aún faltan variantes por contar. Registradas: "
                                                        + contadas + " de " + total + ".");
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

                int total = contarVariantesActivas();

                if (detalles.size() < total) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "El conteo no contiene todas las variantes activas.");
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

                int total = contarVariantesActivas();
                int contadas = detalles.size();

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
                                detalle.getMotivo());
        }

        private int contarVariantesActivas() {

                return (int) varianteRepository.findByActivoTrue()
                                .stream()
                                .filter(v -> v.getProducto() != null
                                                && Boolean.TRUE.equals(v.getProducto().getActivo()))
                                .count();
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