package com.ANB.Models.DTO;

import java.math.BigDecimal;

public record TransferenciaVarianteDTO(
        Long idProductoVariante,
        String codigoProducto,
        String nombreProducto,
        String codigoBarras,
        String talla,
        String color,
        BigDecimal precio,
        Integer existenciaDisponible) {
}