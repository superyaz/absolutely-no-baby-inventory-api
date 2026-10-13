package com.ANB.Models.Service;

import com.ANB.Models.Entity.Producto;
import com.ANB.Models.Repository.ProductoRepository;
import org.springframework.stereotype.Service;

@Service
public class ProductoService extends AbstractCrudService<Producto, String> {
    public ProductoService(ProductoRepository repository) {
        super(repository, Producto::setCodigoProducto);
    }
}
