package com.ANB.Controller;

import com.ANB.Models.DTO.ConteoFisicoDTO;
import com.ANB.Models.Service.ConteoFisicoService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conteos-fisicos")
public class ConteoFisicoController {

    private final ConteoFisicoService service;

    public ConteoFisicoController(ConteoFisicoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConteoFisicoDTO.Resumen> listar(HttpSession session) {
        return service.listar(
                AuthController.obtenerUsuarioId(session));
    }

    @GetMapping("/{id}")
    public ConteoFisicoDTO.Consulta obtener(
            @PathVariable Long id,
            HttpSession session) {
        return service.obtener(
                id,
                AuthController.obtenerUsuarioId(session));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConteoFisicoDTO.Resumen crear(
            @RequestBody(required = false) ConteoFisicoDTO.CrearRequest request,
            HttpSession session) {
        return service.crear(
                request,
                AuthController.obtenerUsuarioId(session));
    }

    @PutMapping("/{id}/detalles")
    public ConteoFisicoDTO.Consulta guardarDetalle(
            @PathVariable Long id,
            @Valid @RequestBody ConteoFisicoDTO.DetalleRequest request,
            HttpSession session) {
        return service.guardarDetalle(
                id,
                request,
                AuthController.obtenerUsuarioId(session));
    }

    @PostMapping("/{id}/finalizar")
    public ConteoFisicoDTO.Resumen finalizar(
            @PathVariable Long id,
            HttpSession session) {
        return service.finalizar(
                id,
                AuthController.obtenerUsuarioId(session));
    }

    @PostMapping("/{id}/aplicar")
    public ConteoFisicoDTO.Resumen aplicar(
            @PathVariable Long id,
            HttpSession session) {
        return service.aplicar(
                id,
                AuthController.obtenerUsuarioId(session));
    }
}