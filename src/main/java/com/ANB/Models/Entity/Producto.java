package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "producto")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Producto {
    @Id
    @Column(name = "codigo_producto", nullable = false)
    private String codigoProducto;

    @NotBlank
    @Column(name = "nombre", nullable = false, length = 180)
    private String nombre;

    @Column(name = "descripcion", nullable = true)
    private String descripcion;

    @DecimalMin("0.0")
    @Column(name = "precio", nullable = false)
    private BigDecimal precio;

    @PositiveOrZero
    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "fecha_creacion", nullable = true)
    private LocalDateTime fechaCreacion;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "grupo_codigo", referencedColumnName = "codigo_grupo", nullable = false)
    private GrupoProducto grupo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_producto_codigo", referencedColumnName = "codigo_tipo_producto", nullable = false)
    private TipoProducto tipoProducto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modelo_codigo", referencedColumnName = "codigo_modelo", nullable = false)
    private ModeloProducto modelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "temporada_id", referencedColumnName = "id_temporada", nullable = true)
    private Temporada temporada;

    public Producto() {}

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

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public GrupoProducto getGrupo() {
        return grupo;
    }

    public void setGrupo(GrupoProducto grupo) {
        this.grupo = grupo;
    }

    public TipoProducto getTipoProducto() {
        return tipoProducto;
    }

    public void setTipoProducto(TipoProducto tipoProducto) {
        this.tipoProducto = tipoProducto;
    }

    public ModeloProducto getModelo() {
        return modelo;
    }

    public void setModelo(ModeloProducto modelo) {
        this.modelo = modelo;
    }

    public Temporada getTemporada() {
        return temporada;
    }

    public void setTemporada(Temporada temporada) {
        this.temporada = temporada;
    }

}
