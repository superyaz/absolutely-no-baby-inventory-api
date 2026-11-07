package com.ANB.Models.Repository;

import com.ANB.Models.Entity.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    List<Movimiento> findTop100ByOrderByFechaDesc();

    List<Movimiento> findTop100BySucursal_IdSucursalOrderByFechaDesc(
            Long sucursalId);

}