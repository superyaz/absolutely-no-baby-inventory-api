package com.ANB.Models.Repository;

import com.ANB.Models.Entity.Transferencia;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferenciaRepository
                extends JpaRepository<Transferencia, Long> {

        @Query("""
                        SELECT t
                        FROM Transferencia t
                        WHERE t.sucursalOrigen.idSucursal = :sucursalId
                           OR t.sucursalDestino.idSucursal = :sucursalId
                        ORDER BY t.fechaSolicitud DESC
                        """)
        List<Transferencia> buscarPorSucursal(
                        @Param("sucursalId") Long sucursalId,
                        Pageable pageable);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        SELECT t
                        FROM Transferencia t
                        WHERE t.idTransferencia = :id
                        """)
        Optional<Transferencia> buscarParaActualizar(
                        @Param("id") Long id);

        @Query("""
                        SELECT COUNT(t)
                        FROM Transferencia t
                        WHERE
                            (
                                t.sucursalOrigen.idSucursal = :sucursalId
                                AND t.estado = 'SOLICITADA'
                            )
                            OR
                            (
                                t.sucursalDestino.idSucursal = :sucursalId
                                AND t.estado = 'EN TRANSITO'
                            )
                        """)
        long contarPendientesQueRequierenAccion(
                        @Param("sucursalId") Long sucursalId);

}