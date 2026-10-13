package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventario", uniqueConstraints = {@UniqueConstraint(columnNames = {"sucursal_id", "producto_variante_id"})})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Inventario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inventario", nullable = false)
    private Long idInventario;

    @PositiveOrZero
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @PositiveOrZero
    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sucursal_id", referencedColumnName = "id_sucursal", nullable = false)
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_variante_id", referencedColumnName = "id_producto_variante", nullable = false)
    private ProductoVariante productoVariante;

    public Inventario() {}

    public Long getIdInventario() {
        return idInventario;
    }

    public void setIdInventario(Long idInventario) {
        this.idInventario = idInventario;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public Sucursal getSucursal() {
        return sucursal;
    }

    public void setSucursal(Sucursal sucursal) {
        this.sucursal = sucursal;
    }

    public ProductoVariante getProductoVariante() {
        return productoVariante;
    }

    public void setProductoVariante(ProductoVariante productoVariante) {
        this.productoVariante = productoVariante;
    }

}
