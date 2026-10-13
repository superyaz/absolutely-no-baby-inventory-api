package com.ANB.Controller;

import com.ANB.Models.Entity.DetalleMovimiento;
import com.ANB.Models.Service.DetalleMovimientoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/detalles-movimiento")
public class DetalleMovimientoController {
    private final DetalleMovimientoService service;

    public DetalleMovimientoController(DetalleMovimientoService service) {
        this.service = service;
    }

    @GetMapping
    public List<DetalleMovimiento> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public DetalleMovimiento obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<DetalleMovimiento> crear(@Valid @RequestBody DetalleMovimiento entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    public DetalleMovimiento actualizar(@PathVariable Long id, @Valid @RequestBody DetalleMovimiento entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
