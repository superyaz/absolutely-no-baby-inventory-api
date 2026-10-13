package com.ANB.Models.Repository;

import com.ANB.Models.Entity.ProductoVariante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoVarianteRepository extends JpaRepository<ProductoVariante, Long> {
}
