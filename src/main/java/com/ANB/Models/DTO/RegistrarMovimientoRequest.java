package com.ANB.Models.DTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public class RegistrarMovimientoRequest {

    @NotBlank
    private String codigoTipoMovimiento;

    private String direccionDevolucion;

    @Size(max = 100)
    private String referencia;

    @Size(max = 1000)
    private String observacion;

    @NotEmpty
    @Valid
    private List<Detalle> detalles;

    public String getCodigoTipoMovimiento() {
        return codigoTipoMovimiento;
    }

    public void setCodigoTipoMovimiento(String codigoTipoMovimiento) {
        this.codigoTipoMovimiento = codigoTipoMovimiento;
    }

    public String getDireccionDevolucion() {
        return direccionDevolucion;
    }

    public void setDireccionDevolucion(String direccionDevolucion) {
        this.direccionDevolucion = direccionDevolucion;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public List<Detalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<Detalle> detalles) {
        this.detalles = detalles;
    }

    public static class Detalle {

        @NotNull
        @Positive
        private Long productoVarianteId;

        @NotNull
        private Integer cantidad;

        public Long getProductoVarianteId() {
            return productoVarianteId;
        }

        public void setProductoVarianteId(Long productoVarianteId) {
            this.productoVarianteId = productoVarianteId;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
    }
}