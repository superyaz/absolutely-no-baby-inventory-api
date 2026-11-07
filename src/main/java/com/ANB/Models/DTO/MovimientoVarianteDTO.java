package com.ANB.Models.DTO;

import java.math.BigDecimal;

public class MovimientoVarianteDTO {

    private Long idProductoVariante;
    private String codigoProducto;
    private String nombreProducto;
    private String codigoBarras;
    private String talla;
    private String color;
    private BigDecimal precio;
    private Integer existenciaActual;

    public MovimientoVarianteDTO(
            Long idProductoVariante,
            String codigoProducto,
            String nombreProducto,
            String codigoBarras,
            String talla,
            String color,
            BigDecimal precio,
            Integer existenciaActual) {

        this.idProductoVariante = idProductoVariante;
        this.codigoProducto = codigoProducto;
        this.nombreProducto = nombreProducto;
        this.codigoBarras = codigoBarras;
        this.talla = talla;
        this.color = color;
        this.precio = precio;
        this.existenciaActual = existenciaActual;
    }

    public Long getIdProductoVariante() {
        return idProductoVariante;
    }

    public String getCodigoProducto() {
        return codigoProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getTalla() {
        return talla;
    }

    public String getColor() {
        return color;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public Integer getExistenciaActual() {
        return existenciaActual;
    }
}