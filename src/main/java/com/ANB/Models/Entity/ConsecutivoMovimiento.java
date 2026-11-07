package com.ANB.Models.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "consecutivo_movimiento")
public class ConsecutivoMovimiento {

    @Id
    @Column(name = "codigo_tipo", length = 3)
    private String codigoTipo;

    @Column(name = "ultimo_numero", nullable = false)
    private Long ultimoNumero;

    public ConsecutivoMovimiento() {
    }

    public String getCodigoTipo() {
        return codigoTipo;
    }

    public void setCodigoTipo(String codigoTipo) {
        this.codigoTipo = codigoTipo;
    }

    public Long getUltimoNumero() {
        return ultimoNumero;
    }

    public void setUltimoNumero(Long ultimoNumero) {
        this.ultimoNumero = ultimoNumero;
    }
}