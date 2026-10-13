package com.ANB.Models.Repository;

import com.ANB.Models.Entity.DetalleConteo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetalleConteoRepository extends JpaRepository<DetalleConteo, Long> {
}
