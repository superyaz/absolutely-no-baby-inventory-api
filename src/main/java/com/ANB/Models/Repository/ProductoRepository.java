
package com.ANB.Models.Repository;

import com.ANB.Models.Entity.Producto;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, String> {

    Optional<Producto> findTopByCodigoProductoStartingWithOrderByCodigoProductoDesc(
            String prefijo);
}
