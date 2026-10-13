package com.ANB.Models.Service;

import com.ANB.Models.Entity.Rol;
import com.ANB.Models.Repository.RolRepository;
import org.springframework.stereotype.Service;

@Service
public class RolService extends AbstractCrudService<Rol, Long> {
    public RolService(RolRepository repository) {
        super(repository, Rol::setIdRol);
    }
}
