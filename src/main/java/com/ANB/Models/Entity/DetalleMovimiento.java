package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "detalle_movimiento")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DetalleMovimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_movimiento", nullable = false)
    private Long idDetalleMovimiento;

    @Positive
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "movimiento_id", referencedColumnName = "id_movimiento", nullable = false)
    private Movimiento movimiento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_variante_id", referencedColumnName = "id_producto_variante", nullable = false)
    private ProductoVariante productoVariante;

    public DetalleMovimiento() {}

    public Long getIdDetalleMovimiento() {
        return idDetalleMovimiento;
    }

    public void setIdDetalleMovimiento(Long idDetalleMovimiento) {
        this.idDetalleMovimiento = idDetalleMovimiento;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Movimiento getMovimiento() {
        return movimiento;
    }

    public void setMovimiento(Movimiento movimiento) {
        this.movimiento = movimiento;
    }

    public ProductoVariante getProductoVariante() {
        return productoVariante;
    }

    public void setProductoVariante(ProductoVariante productoVariante) {
        this.productoVariante = productoVariante;
    }

}
