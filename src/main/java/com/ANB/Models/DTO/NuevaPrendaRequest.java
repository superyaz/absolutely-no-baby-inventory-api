
package com.ANB.Models.DTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class NuevaPrendaRequest {

    @NotBlank
    private String codigoGrupo;

    @NotBlank
    private String codigoTipoProducto;

    @NotBlank
    private String codigoModelo;

    @NotBlank
    private String nombre;

    private String descripcion;

    private Long idTemporada;

    @PositiveOrZero
    private Integer stock;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal precio;

    @NotBlank
    private String talla;

    @NotBlank
    private String color;

    public String getCodigoGrupo() {
        return codigoGrupo;
    }

    public void setCodigoGrupo(String codigoGrupo) {
        this.codigoGrupo = codigoGrupo;
    }

    public String getCodigoTipoProducto() {
        return codigoTipoProducto;
    }

    public void setCodigoTipoProducto(String codigoTipoProducto) {
        this.codigoTipoProducto = codigoTipoProducto;
    }

    public String getCodigoModelo() {
        return codigoModelo;
    }

    public void setCodigoModelo(String codigoModelo) {
        this.codigoModelo = codigoModelo;
    }

    public String getNombre() {
        return nombre;
    }

    public Long getIdTemporada() {
        return idTemporada;
    }

    public void setIdTemporada(Long idTemporada) {
        this.idTemporada = idTemporada;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public String getTalla() {
        return talla;
    }

    public void setTalla(String talla) {
        this.talla = talla;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
