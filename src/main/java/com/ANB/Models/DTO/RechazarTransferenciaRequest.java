package com.ANB.Models.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RechazarTransferenciaRequest(

        @NotBlank(message = "Indica el motivo del rechazo.") @Size(max = 500, message = "El motivo no puede superar 500 caracteres.") String observacion

) {
}