package com.ANB.Models.DTO;

public record DisponibilidadVarianteSucursalDTO(
        Long idSucursal,
        String nombreSucursal,
        String ciudad,
        Integer existenciaDisponible) {
}