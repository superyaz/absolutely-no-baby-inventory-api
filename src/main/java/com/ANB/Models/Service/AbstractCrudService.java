package com.ANB.Models.Service;

import java.util.List;
import java.util.function.BiConsumer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

public abstract class AbstractCrudService<T, ID> {
    protected final JpaRepository<T, ID> repository;
    private final BiConsumer<T, ID> idSetter;

    protected AbstractCrudService(JpaRepository<T, ID> repository, BiConsumer<T, ID> idSetter) {
        this.repository = repository;
        this.idSetter = idSetter;
    }

    @Transactional(readOnly = true)
    public List<T> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public T findById(ID id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado"));
    }

    @Transactional
    public T create(T entity) {
        return repository.save(entity);
    }

    @Transactional
    public T update(ID id, T entity) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado");
        }
        idSetter.accept(entity, id);
        return repository.save(entity);
    }

    @Transactional
    public void delete(ID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado");
        }
        repository.deleteById(id);
    }
}
