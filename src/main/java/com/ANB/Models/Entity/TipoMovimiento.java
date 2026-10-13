package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "tipo_movimiento")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TipoMovimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_movimiento", nullable = false)
    private Long idTipoMovimiento;

    @NotBlank
    @Column(name = "codigo", nullable = false, unique = true, length = 40)
    private String codigo;

    @NotBlank
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @NotBlank
    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo;

    @Column(name = "afecta_inventario", nullable = false)
    private Boolean afectaInventario;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    public TipoMovimiento() {}

    public Long getIdTipoMovimiento() {
        return idTipoMovimiento;
    }

    public void setIdTipoMovimiento(Long idTipoMovimiento) {
        this.idTipoMovimiento = idTipoMovimiento;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Boolean getAfectaInventario() {
        return afectaInventario;
    }

    public void setAfectaInventario(Boolean afectaInventario) {
        this.afectaInventario = afectaInventario;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

}
