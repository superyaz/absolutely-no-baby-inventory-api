package com.ANB.Models.Repository;

import com.ANB.Models.Entity.GrupoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupoProductoRepository extends JpaRepository<GrupoProducto, String> {
}
