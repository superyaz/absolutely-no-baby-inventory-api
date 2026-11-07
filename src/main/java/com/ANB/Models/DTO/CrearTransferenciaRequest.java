package com.ANB.Models.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CrearTransferenciaRequest(

        @NotNull(message = "Selecciona la sucursal de origen.") @Positive(message = "La sucursal de origen no es válida.") Long sucursalOrigenId,

        @Size(max = 1000, message = "Las observaciones no pueden superar 1000 caracteres.") String observacion,

        @NotEmpty(message = "Agrega al menos una variante a la transferencia.") List<@Valid Detalle> detalles

) {

    public record Detalle(

            @NotNull(message = "Selecciona una variante.") @Positive(message = "La variante no es válida.") Long productoVarianteId,

            @NotNull(message = "Indica la cantidad solicitada.") @Positive(message = "La cantidad solicitada debe ser mayor que cero.") Integer cantidadSolicitada

    ) {
    }
}