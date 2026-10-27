package com.ANB.Controller;

import com.ANB.Models.Entity.GrupoProducto;
import com.ANB.Models.Service.GrupoProductoService;
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
@RequestMapping("/api/grupos-producto")
public class GrupoProductoController {
    private final GrupoProductoService service;

    public GrupoProductoController(GrupoProductoService service) {
        this.service = service;
    }

    @GetMapping
    public List<GrupoProducto> listar() {
        return service.listarActivos();
    }

    @GetMapping("/{id}")
    public GrupoProducto obtener(@PathVariable String id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<GrupoProducto> crear(@Valid @RequestBody GrupoProducto entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @PutMapping("/{id}")
    public GrupoProducto actualizar(@PathVariable String id, @Valid @RequestBody GrupoProducto entity) {
        return service.update(id, entity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        service.delete(id);
    }
}
