package com.ANB.Models.Service;

import com.ANB.Models.Entity.ModeloProducto;
import com.ANB.Models.Repository.ModeloProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ModeloProductoService
        extends AbstractCrudService<ModeloProducto, String> {

    private final ModeloProductoRepository repository;

    public ModeloProductoService(ModeloProductoRepository repository) {
        super(repository, ModeloProducto::setCodigoModelo);
        this.repository = repository;
    }

    public List<ModeloProducto> listarActivos() {
        return repository.findByActivoTrueOrderByCodigoModeloAsc();
    }
}
