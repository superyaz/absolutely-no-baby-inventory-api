package com.ANB.Models.Repository;

import com.ANB.Models.Entity.ConteoFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConteoFisicoRepository extends JpaRepository<ConteoFisico, Long> {
}
