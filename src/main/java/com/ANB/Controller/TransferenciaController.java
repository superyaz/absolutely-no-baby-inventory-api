package com.ANB.Controller;

import com.ANB.Models.DTO.CrearTransferenciaRequest;
import com.ANB.Models.DTO.RechazarTransferenciaRequest;
import com.ANB.Models.DTO.TransferenciaContextoDTO;
import com.ANB.Models.DTO.TransferenciaDTO;
import com.ANB.Models.DTO.TransferenciaVarianteDTO;
import com.ANB.Models.DTO.DisponibilidadVarianteSucursalDTO;

import com.ANB.Models.Service.TransferenciaService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transferencias")
public class TransferenciaController {

    private final TransferenciaService service;

    public TransferenciaController(
            TransferenciaService service) {

        this.service = service;
    }

    @GetMapping("/contexto")
    public TransferenciaContextoDTO contexto(
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.obtenerContexto(usuarioId);
    }

    @GetMapping("/variantes")
    public List<TransferenciaVarianteDTO> variantes(

            @RequestParam Long sucursalOrigenId,

            @RequestParam(required = false, defaultValue = "") String q,

            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.buscarVariantes(
                usuarioId,
                sucursalOrigenId,
                q);
    }

    @GetMapping("/variantes/{varianteId}/sucursales-disponibles")
    public List<DisponibilidadVarianteSucursalDTO> listarSucursalesDisponibles(
            @PathVariable Long varianteId,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.listarSucursalesDisponibles(
                usuarioId,
                varianteId);
    }

    @GetMapping
    public List<TransferenciaDTO> listar(
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.listar(usuarioId);
    }

    @GetMapping("/{id}")
    public TransferenciaDTO obtener(
            @PathVariable Long id,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.obtener(id, usuarioId);
    }

    @PostMapping("/solicitar")
    public ResponseEntity<TransferenciaDTO> solicitar(

            @Valid @RequestBody CrearTransferenciaRequest request,

            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        TransferenciaDTO transferencia = service.solicitar(request, usuarioId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(transferencia);
    }

    @PostMapping("/{id}/aprobar")
    public TransferenciaDTO aprobar(
            @PathVariable Long id,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.aprobar(id, usuarioId);
    }

    @PostMapping("/{id}/recibir")
    public TransferenciaDTO recibir(
            @PathVariable Long id,
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.recibir(id, usuarioId);
    }

    @PostMapping("/{id}/rechazar")
    public TransferenciaDTO rechazar(

            @PathVariable Long id,

            @Valid @RequestBody RechazarTransferenciaRequest request,

            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        return service.rechazar(
                id,
                request,
                usuarioId);
    }

    @GetMapping("/pendientes/contador")
    public Map<String, Long> contarPendientes(
            HttpSession session) {

        Long usuarioId = AuthController.obtenerUsuarioId(session);

        long cantidad = service.contarPendientesAccion(usuarioId);

        return Map.of(
                "cantidad",
                cantidad);
    }
}