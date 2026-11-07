package com.ANB.Models.Repository;

import com.ANB.Models.Entity.Inventario;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventarioRepository
        extends JpaRepository<Inventario, Long> {

    List<Inventario> findBySucursal_IdSucursal(Long sucursalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
                SELECT i
                FROM Inventario i
                WHERE i.sucursal.idSucursal = :sucursalId
                AND i.productoVariante.idProductoVariante = :varianteId
            """)
    Optional<Inventario> buscarParaActualizar(
            @Param("sucursalId") Long sucursalId,
            @Param("varianteId") Long varianteId);
}