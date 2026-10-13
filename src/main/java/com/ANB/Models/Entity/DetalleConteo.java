package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "detalle_conteo")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DetalleConteo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_detalle_conteo", nullable = false)
    private Long idDetalleConteo;

    @PositiveOrZero
    @Column(name = "cantidad_sistema", nullable = false)
    private Integer cantidadSistema;

    @PositiveOrZero
    @Column(name = "cantidad_fisica", nullable = false)
    private Integer cantidadFisica;

    @Column(name = "diferencia", nullable = false)
    private Integer diferencia;

    @Column(name = "motivo", nullable = true, length = 1000)
    private String motivo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conteo_fisico_id", referencedColumnName = "id_conteo_fisico", nullable = false)
    private ConteoFisico conteoFisico;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_variante_id", referencedColumnName = "id_producto_variante", nullable = false)
    private ProductoVariante productoVariante;

    public DetalleConteo() {}

    public Long getIdDetalleConteo() {
        return idDetalleConteo;
    }

    public void setIdDetalleConteo(Long idDetalleConteo) {
        this.idDetalleConteo = idDetalleConteo;
    }

    public Integer getCantidadSistema() {
        return cantidadSistema;
    }

    public void setCantidadSistema(Integer cantidadSistema) {
        this.cantidadSistema = cantidadSistema;
    }

    public Integer getCantidadFisica() {
        return cantidadFisica;
    }

    public void setCantidadFisica(Integer cantidadFisica) {
        this.cantidadFisica = cantidadFisica;
    }

    public Integer getDiferencia() {
        return diferencia;
    }

    public void setDiferencia(Integer diferencia) {
        this.diferencia = diferencia;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public ConteoFisico getConteoFisico() {
        return conteoFisico;
    }

    public void setConteoFisico(ConteoFisico conteoFisico) {
        this.conteoFisico = conteoFisico;
    }

    public ProductoVariante getProductoVariante() {
        return productoVariante;
    }

    public void setProductoVariante(ProductoVariante productoVariante) {
        this.productoVariante = productoVariante;
    }

}
