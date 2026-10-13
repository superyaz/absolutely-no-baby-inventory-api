package com.ANB.Models.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "transferencia")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Transferencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transferencia", nullable = false)
    private Long idTransferencia;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "fecha_respuesta", nullable = true)
    private LocalDateTime fechaRespuesta;

    @NotBlank
    @Column(name = "estado", nullable = false, length = 40)
    private String estado;

    @Column(name = "observacion", nullable = true, length = 1000)
    private String observacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sucursal_origen_id", referencedColumnName = "id_sucursal", nullable = false)
    private Sucursal sucursalOrigen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sucursal_destino_id", referencedColumnName = "id_sucursal", nullable = false)
    private Sucursal sucursalDestino;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_solicitante_id", referencedColumnName = "id_usuario", nullable = false)
    private Usuario usuarioSolicitante;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_responsable_id", referencedColumnName = "id_usuario", nullable = true)
    private Usuario usuarioResponsable;

    public Transferencia() {}

    public Long getIdTransferencia() {
        return idTransferencia;
    }

    public void setIdTransferencia(Long idTransferencia) {
        this.idTransferencia = idTransferencia;
    }

    public LocalDateTime getFechaSolicitud() {
        return fechaSolicitud;
    }

    public void setFechaSolicitud(LocalDateTime fechaSolicitud) {
        this.fechaSolicitud = fechaSolicitud;
    }

    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }

    public void setFechaRespuesta(LocalDateTime fechaRespuesta) {
        this.fechaRespuesta = fechaRespuesta;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public Sucursal getSucursalOrigen() {
        return sucursalOrigen;
    }

    public void setSucursalOrigen(Sucursal sucursalOrigen) {
        this.sucursalOrigen = sucursalOrigen;
    }

    public Sucursal getSucursalDestino() {
        return sucursalDestino;
    }

    public void setSucursalDestino(Sucursal sucursalDestino) {
        this.sucursalDestino = sucursalDestino;
    }

    public Usuario getUsuarioSolicitante() {
        return usuarioSolicitante;
    }

    public void setUsuarioSolicitante(Usuario usuarioSolicitante) {
        this.usuarioSolicitante = usuarioSolicitante;
    }

    public Usuario getUsuarioResponsable() {
        return usuarioResponsable;
    }

    public void setUsuarioResponsable(Usuario usuarioResponsable) {
        this.usuarioResponsable = usuarioResponsable;
    }

}
