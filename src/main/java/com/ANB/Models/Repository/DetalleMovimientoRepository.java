package com.ANB.Models.Repository;

import com.ANB.Models.Entity.DetalleMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetalleMovimientoRepository extends JpaRepository<DetalleMovimiento, Long> {
    List<DetalleMovimiento> findByMovimiento_IdMovimiento(Long movimientoId);
}
