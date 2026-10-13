package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rol_permisos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RolPermiso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rol_permisos", nullable = false)
    private Long idRolPermisos;

    @Column(name = "fecha_permiso", nullable = true)
    private LocalDateTime fechaPermiso;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id", referencedColumnName = "id_rol", nullable = false)
    private Rol rol;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "permiso_id", referencedColumnName = "id_permiso", nullable = false)
    private Permiso permiso;

    public RolPermiso() {}

    public Long getIdRolPermisos() {
        return idRolPermisos;
    }

    public void setIdRolPermisos(Long idRolPermisos) {
        this.idRolPermisos = idRolPermisos;
    }

    public LocalDateTime getFechaPermiso() {
        return fechaPermiso;
    }

    public void setFechaPermiso(LocalDateTime fechaPermiso) {
        this.fechaPermiso = fechaPermiso;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public Permiso getPermiso() {
        return permiso;
    }

    public void setPermiso(Permiso permiso) {
        this.permiso = permiso;
    }

}
