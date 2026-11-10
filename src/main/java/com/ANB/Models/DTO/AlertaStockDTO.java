package com.ANB.Models.DTO;

public record AlertaStockDTO(
        Long idProductoVariante,
        String codigoProducto,
        String nombreProducto,
        String codigoBarras,
        String talla,
        String color,
        String temporada,
        Integer stockActual,
        Integer stockMinimo,
        Integer unidadesParaMinimo) {
}