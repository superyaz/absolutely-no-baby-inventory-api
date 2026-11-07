package com.ANB.Models.DTO;

import java.time.LocalDateTime;
import java.util.List;

public record TransferenciaDTO(
        Long idTransferencia,
        String referencia,
        LocalDateTime fechaSolicitud,
        LocalDateTime fechaRespuesta,
        String estado,
        String observacion,
        Long sucursalOrigenId,
        String sucursalOrigen,
        String ciudadOrigen,
        Long sucursalDestinoId,
        String sucursalDestino,
        String ciudadDestino,
        String usuarioSolicitante,
        String usuarioResponsable,
        List<TransferenciaDetalleDTO> detalles,
        boolean puedeAprobar,
        boolean puedeRechazar,
        boolean puedeRecibir) {
}