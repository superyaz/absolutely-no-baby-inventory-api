package com.ANB.Models.Repository;

import com.ANB.Models.Entity.ConteoFisico;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConteoFisicoRepository
        extends JpaRepository<ConteoFisico, Long> {

    List<ConteoFisico> findBySucursal_IdSucursalOrderByFechaInicioDesc(
            Long sucursalId);

    Optional<ConteoFisico> findByIdConteoFisicoAndSucursal_IdSucursal(
            Long id,
            Long sucursalId);
}