package com.ANB.Models.DTO;

public record UsuarioSesionDTO(
                Long idUsuario,
                String nombre,
                String apellido,
                String email,
                String rol,
                Long sucursalId,
                String sucursal,
                String sucursalCiudad) {
}