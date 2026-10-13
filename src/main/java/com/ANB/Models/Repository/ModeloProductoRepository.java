package com.ANB.Models.Repository;

import com.ANB.Models.Entity.ModeloProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModeloProductoRepository extends JpaRepository<ModeloProducto, String> {
}
