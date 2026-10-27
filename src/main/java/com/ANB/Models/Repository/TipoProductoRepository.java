
package com.ANB.Models.Repository;

import com.ANB.Models.Entity.TipoProducto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoProductoRepository
        extends JpaRepository<TipoProducto, String> {

    List<TipoProducto> findByActivoTrueOrderByCodigoTipoProductoAsc();
}
