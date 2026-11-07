package com.ANB.Models.DTO;

public record TransferenciaDetalleDTO(
        Long idDetalleTransferencia,
        Long idProductoVariante,
        String codigoProducto,
        String nombreProducto,
        String codigoBarras,
        String talla,
        String color,
        Integer cantidadSolicitada,
        Integer cantidadAprobada

) {
}