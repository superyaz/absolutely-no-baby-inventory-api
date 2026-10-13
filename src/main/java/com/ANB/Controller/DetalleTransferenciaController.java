package com.ANB.Controller;

import com.ANB.Models.Entity.DetalleTransferencia;
import com.ANB.Models.Service.DetalleTransferenciaService;
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
@RequestMapping("/api/detalles-transferencia")
public class DetalleTransferenciaController {
    private final DetalleTransferenciaService service;

    public DetalleTransferenciaController(DetalleTransferenciaService service) {
        this.service = service;
    }

    @GetMapping
    public List<DetalleTransferencia> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public DetalleTransferencia obtener(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<DetalleTransferencia> crear(@Valid @RequestBody DetalleTransferencia entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    public DetalleTransferencia actualizar(@PathVariable Long id, @Valid @RequestBody DetalleTransferencia entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.delete(id);
    }
}
