
package com.ANB.Models.Repository;

import com.ANB.Models.Entity.ConsecutivoMovimiento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsecutivoMovimientoRepository
                extends JpaRepository<ConsecutivoMovimiento, String> {

        @Query(value = """
                            SELECT *
                            FROM consecutivo_movimiento
                            WHERE codigo_tipo = :codigo
                            FOR UPDATE
                        """, nativeQuery = true)
        Optional<ConsecutivoMovimiento> buscarBloqueado(
                        @Param("codigo") String codigo);
}
