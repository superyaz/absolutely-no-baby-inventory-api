package com.ANB.Models.Repository;

import com.ANB.Models.Entity.DetalleConteo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleConteoRepository
        extends JpaRepository<DetalleConteo, Long> {

    List<DetalleConteo> findByConteoFisico_IdConteoFisicoOrderByIdDetalleConteoAsc(
            Long conteoId);

    Optional<DetalleConteo> findByConteoFisico_IdConteoFisicoAndProductoVariante_IdProductoVariante(
            Long conteoId,
            Long varianteId);

    long countByConteoFisico_IdConteoFisico(Long conteoId);
}