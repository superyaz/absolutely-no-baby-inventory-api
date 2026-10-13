package com.ANB.Models.Service;

import com.ANB.Models.Entity.ModeloProducto;
import com.ANB.Models.Repository.ModeloProductoRepository;
import org.springframework.stereotype.Service;

@Service
public class ModeloProductoService extends AbstractCrudService<ModeloProducto, String> {
    public ModeloProductoService(ModeloProductoRepository repository) {
        super(repository, ModeloProducto::setCodigoModelo);
    }
}
