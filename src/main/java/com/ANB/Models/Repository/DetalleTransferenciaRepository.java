package com.ANB.Models.Repository;

import com.ANB.Models.Entity.DetalleTransferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleTransferenciaRepository extends JpaRepository<DetalleTransferencia, Long> {
}
