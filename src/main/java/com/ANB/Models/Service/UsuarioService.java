package com.ANB.Models.Service;

import com.ANB.Models.Entity.Usuario;
import com.ANB.Models.Repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService extends AbstractCrudService<Usuario, Long> {
    private final PasswordHasher passwordHasher;

    public UsuarioService(UsuarioRepository repository, PasswordHasher passwordHasher) {
        super(repository, Usuario::setIdUsuario);
        this.passwordHasher = passwordHasher;
    }

    @Override
    @Transactional
    public Usuario create(Usuario entity) {
        entity.setPassword(passwordHasher.hash(entity.getPassword()));
        return super.create(entity);
    }

    @Override
    @Transactional
    public Usuario update(Long id, Usuario entity) {
        entity.setPassword(passwordHasher.hash(entity.getPassword()));
        return super.update(id, entity);
    }
}
