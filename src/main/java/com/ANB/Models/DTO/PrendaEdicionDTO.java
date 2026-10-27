
package com.ANB.Models.DTO;

import java.math.BigDecimal;

public class PrendaEdicionDTO {

    private String codigoProducto;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Integer stock;

    private String codigoGrupo;
    private String codigoTipoProducto;
    private String codigoModelo;
    private Long idTemporada;

    private String talla;
    private String color;

    public String getCodigoProducto() {
        return codigoProducto;
    }

    public void setCodigoProducto(String codigoProducto) {
        this.codigoProducto = codigoProducto;
    }

    public String getNombre() {
        return nombre;
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

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

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

    public Long getIdTemporada() {
        return idTemporada;
    }

    public void setIdTemporada(Long idTemporada) {
        this.idTemporada = idTemporada;
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
