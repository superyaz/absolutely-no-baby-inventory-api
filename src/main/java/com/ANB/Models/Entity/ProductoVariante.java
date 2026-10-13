package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Entity
@Table(name = "producto_variante")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProductoVariante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto_variante", nullable = false)
    private Long idProductoVariante;

    @NotBlank
    @Column(name = "codigo_barras", nullable = false, unique = true, length = 80)
    private String codigoBarras;

    @NotBlank
    @Column(name = "talla", nullable = false, length = 40)
    private String talla;

    @NotBlank
    @Column(name = "color", nullable = false, length = 60)
    private String color;

    @DecimalMin("0.0")
    @Column(name = "precio", nullable = false)
    private BigDecimal precio;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_codigo", referencedColumnName = "codigo_producto", nullable = false)
    private Producto producto;

    public ProductoVariante() {}

    public Long getIdProductoVariante() {
        return idProductoVariante;
    }

    public void setIdProductoVariante(Long idProductoVariante) {
        this.idProductoVariante = idProductoVariante;
    }

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
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

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

}
