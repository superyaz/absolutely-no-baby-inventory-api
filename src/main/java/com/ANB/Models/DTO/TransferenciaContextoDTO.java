package com.ANB.Models.DTO;

import java.util.List;

public record TransferenciaContextoDTO(
        Long sucursalActualId,
        String sucursalActualNombre,
        String sucursalActualCiudad,
        List<SucursalTransferenciaDTO> sucursalesOrigen) {
}