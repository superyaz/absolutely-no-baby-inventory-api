package com.ANB.Models.Service;

import com.ANB.Models.Entity.GrupoProducto;
import com.ANB.Models.Repository.GrupoProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GrupoProductoService
        extends AbstractCrudService<GrupoProducto, String> {

    private final GrupoProductoRepository repository;

    public GrupoProductoService(GrupoProductoRepository repository) {
        super(repository, GrupoProducto::setCodigoGrupo);
        this.repository = repository;
    }

    public List<GrupoProducto> listarActivos() {
        return repository.findByActivoTrueOrderByCodigoGrupoAsc();
    }
}
