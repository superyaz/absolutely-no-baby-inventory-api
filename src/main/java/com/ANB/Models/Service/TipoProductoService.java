package com.ANB.Models.Service;

import com.ANB.Models.Entity.TipoProducto;
import com.ANB.Models.Repository.TipoProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TipoProductoService
        extends AbstractCrudService<TipoProducto, String> {

    private final TipoProductoRepository repository;

    public TipoProductoService(TipoProductoRepository repository) {
        super(repository, TipoProducto::setCodigoTipoProducto);
        this.repository = repository;
    }

    public List<TipoProducto> listarActivos() {
        return repository.findByActivoTrueOrderByCodigoTipoProductoAsc();
    }
}
