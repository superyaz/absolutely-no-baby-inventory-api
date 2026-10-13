package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "detalle_transferencia")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DetalleTransferencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_transferencia", nullable = false)
    private Long idDetalleTransferencia;

    @Positive
    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidadSolicitada;

    @PositiveOrZero
    @Column(name = "cantidad_aprobada", nullable = false)
    private Integer cantidadAprobada;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transferencia_id", referencedColumnName = "id_transferencia", nullable = false)
    private Transferencia transferencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_variante_id", referencedColumnName = "id_producto_variante", nullable = false)
    private ProductoVariante productoVariante;

    public DetalleTransferencia() {}

    public Long getIdDetalleTransferencia() {
        return idDetalleTransferencia;
    }

    public void setIdDetalleTransferencia(Long idDetalleTransferencia) {
        this.idDetalleTransferencia = idDetalleTransferencia;
    }

    public Integer getCantidadSolicitada() {
        return cantidadSolicitada;
    }

    public void setCantidadSolicitada(Integer cantidadSolicitada) {
        this.cantidadSolicitada = cantidadSolicitada;
    }

    public Integer getCantidadAprobada() {
        return cantidadAprobada;
    }

    public void setCantidadAprobada(Integer cantidadAprobada) {
        this.cantidadAprobada = cantidadAprobada;
    }

    public Transferencia getTransferencia() {
        return transferencia;
    }

    public void setTransferencia(Transferencia transferencia) {
        this.transferencia = transferencia;
    }

    public ProductoVariante getProductoVariante() {
        return productoVariante;
    }

    public void setProductoVariante(ProductoVariante productoVariante) {
        this.productoVariante = productoVariante;
    }

}
