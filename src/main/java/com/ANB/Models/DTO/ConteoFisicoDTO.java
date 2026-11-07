package com.ANB.Models.DTO;

import java.time.LocalDateTime;
import java.util.List;

public final class ConteoFisicoDTO {

    private ConteoFisicoDTO() {
    }

    public record Resumen(
            Long id,
            String referencia,
            String sucursal,
            String estado,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String responsable,
            String observacion,
            int totalVariantes,
            int variantesContadas,
            int porcentaje,
            int diferencias,
            int sobrantes,
            int faltantes) {
    }

    public record Detalle(
            Long id,
            Long productoVarianteId,
            String codigoProducto,
            String nombreProducto,
            String codigoBarras,
            String talla,
            String color,
            Integer cantidadSistema,
            Integer cantidadFisica,
            Integer diferencia,
            String motivo) {
    }

    public record Consulta(
            Resumen conteo,
            List<Detalle> detalles) {
    }

    public record CrearRequest(String observacion) {
    }

    public record DetalleRequest(
            Long productoVarianteId,
            Integer cantidadFisica,
            String motivo) {
    }
}