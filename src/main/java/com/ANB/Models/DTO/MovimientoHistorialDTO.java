package com.ANB.Models.DTO;

import java.time.LocalDateTime;

public record MovimientoHistorialDTO(
        Long idMovimiento,
        LocalDateTime fecha,
        String codigoTipo,
        String nombreTipo,
        String sucursal,
        String usuario,
        Integer unidadesAfectadas,
        String detalleProductos,
        String referencia,
        String observacion,
        String estado) {
}