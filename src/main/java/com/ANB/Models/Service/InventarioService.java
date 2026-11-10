package com.ANB.Models.Service;

import com.ANB.Models.DTO.AlertaStockDTO;
import com.ANB.Models.Entity.Inventario;
import com.ANB.Models.Entity.Producto;
import com.ANB.Models.Entity.ProductoVariante;
import com.ANB.Models.Entity.Sucursal;
import com.ANB.Models.Entity.Usuario;
import com.ANB.Models.Repository.InventarioRepository;
import com.ANB.Models.Repository.UsuarioRepository;

import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InventarioService
        extends AbstractCrudService<Inventario, Long> {

    private static final int STOCK_MINIMO_PREDETERMINADO = 5;

    private final InventarioRepository inventarioRepository;
    private final UsuarioRepository usuarioRepository;

    public InventarioService(
            InventarioRepository repository,
            UsuarioRepository usuarioRepository) {

        super(repository, Inventario::setIdInventario);

        this.inventarioRepository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<AlertaStockDTO> listarAlertasStock(Long usuarioId) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "No se pudo identificar al usuario autenticado."));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario autenticado está inactivo.");
        }

        Sucursal sucursal = usuario.getSucursal();

        if (sucursal == null ||
                !Boolean.TRUE.equals(sucursal.getActivo())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario no tiene una sucursal activa asignada.");
        }

        return inventarioRepository
                .findBySucursal_IdSucursal(sucursal.getIdSucursal())
                .stream()

                .filter(inventario -> inventario.getProductoVariante() != null)

                .filter(inventario -> {

                    ProductoVariante variante = inventario.getProductoVariante();

                    Producto producto = variante.getProducto();

                    return Boolean.TRUE.equals(variante.getActivo())
                            && producto != null
                            && Boolean.TRUE.equals(producto.getActivo());
                })

                .filter(inventario -> {

                    int actual = inventario.getCantidad() == null
                            ? 0
                            : inventario.getCantidad();

                    int minimo = inventario.getStockMinimo() == null
                            ? STOCK_MINIMO_PREDETERMINADO
                            : inventario.getStockMinimo();

                    return actual <= minimo;
                })

                .map(inventario -> {

                    ProductoVariante variante = inventario.getProductoVariante();

                    Producto producto = variante.getProducto();

                    int actual = inventario.getCantidad() == null
                            ? 0
                            : inventario.getCantidad();

                    int minimo = inventario.getStockMinimo() == null
                            ? STOCK_MINIMO_PREDETERMINADO
                            : inventario.getStockMinimo();

                    String temporada = producto.getTemporada() == null
                            ? null
                            : producto.getTemporada().getNombre();

                    return new AlertaStockDTO(
                            variante.getIdProductoVariante(),
                            producto.getCodigoProducto(),
                            producto.getNombre(),
                            variante.getCodigoBarras(),
                            variante.getTalla(),
                            variante.getColor(),
                            temporada,
                            actual,
                            minimo,
                            Math.max(0, minimo - actual));
                })

                .sorted(
                        Comparator
                                .comparingInt(AlertaStockDTO::stockActual)
                                .thenComparing(
                                        AlertaStockDTO::nombreProducto,
                                        String.CASE_INSENSITIVE_ORDER))

                .toList();
    }
}