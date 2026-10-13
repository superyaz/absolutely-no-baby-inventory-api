package com.ANB.Controller;

import com.ANB.Models.Entity.TipoMovimiento;
import com.ANB.Models.Service.TipoMovimientoService;
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
@RequestMapping("/api/tipos-movimiento")
public class TipoMovimientoController {
    private final TipoMovimientoService service;

    public TipoMovimientoController(TipoMovimientoService service) {
        this.service = service;
    }

    @GetMapping
    public List<TipoMovimiento> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TipoMovimiento obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<TipoMovimiento> crear(@Valid @RequestBody TipoMovimiento entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    public TipoMovimiento actualizar(@PathVariable Long id, @Valid @RequestBody TipoMovimiento entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
