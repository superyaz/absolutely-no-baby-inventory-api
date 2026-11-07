package com.ANB.Controller;

import com.ANB.Models.Entity.Movimiento;
import com.ANB.Models.Service.MovimientoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import com.ANB.Models.DTO.MovimientoVarianteDTO;
import com.ANB.Models.DTO.MovimientoHistorialDTO;
import com.ANB.Models.DTO.RegistrarMovimientoRequest;
import com.ANB.Models.Service.RegistrarMovimientoService;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {
    private final MovimientoService service;
    private final RegistrarMovimientoService registrarMovimientoService;

    public MovimientoController(
            MovimientoService service,
            RegistrarMovimientoService registrarMovimientoService) {

        this.service = service;
        this.registrarMovimientoService = registrarMovimientoService;
    }

    @GetMapping
    public List<Movimiento> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Movimiento obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/proxima-referencia")
    public Map<String, String> proximaReferencia(
            @RequestParam String codigo) {

        return Map.of(
                "referencia",
                registrarMovimientoService.previsualizarReferencia(
                        codigo.toUpperCase()));
    }

    @GetMapping("/variantes")
    public List<MovimientoVarianteDTO> buscarVariantes(
            @RequestParam(required = false, defaultValue = "") String q,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return registrarMovimientoService.buscarVariantes(
                usuarioId,
                q);
    }

    @GetMapping("/historial")
    public List<MovimientoHistorialDTO> historial(
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return registrarMovimientoService.listarHistorial(
                usuarioId);
    }

    @PostMapping("/registrar")
    public ResponseEntity<Movimiento> registrar(
            @Valid @RequestBody RegistrarMovimientoRequest request,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        Movimiento movimiento = registrarMovimientoService.registrar(
                request,
                usuarioId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(movimiento);
    }

    @PostMapping
    public ResponseEntity<Movimiento> crear(@Valid @RequestBody Movimiento entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    public Movimiento actualizar(@PathVariable Long id, @Valid @RequestBody Movimiento entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
