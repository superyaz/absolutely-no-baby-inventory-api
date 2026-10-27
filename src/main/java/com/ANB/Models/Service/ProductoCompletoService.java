package com.ANB.Models.Service;

import com.ANB.Models.DTO.NuevaPrendaRequest;
import com.ANB.Models.Entity.GrupoProducto;
import com.ANB.Models.Entity.ModeloProducto;
import com.ANB.Models.Entity.Producto;
import com.ANB.Models.Entity.ProductoVariante;
import com.ANB.Models.Entity.Temporada;
import com.ANB.Models.Entity.TipoProducto;
import com.ANB.Models.Repository.GrupoProductoRepository;
import com.ANB.Models.Repository.ModeloProductoRepository;
import com.ANB.Models.Repository.ProductoRepository;
import com.ANB.Models.Repository.ProductoVarianteRepository;
import com.ANB.Models.Repository.TemporadaRepository;
import com.ANB.Models.Repository.TipoProductoRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductoCompletoService {

        private final ProductoRepository productoRepository;
        private final ProductoVarianteRepository varianteRepository;
        private final GrupoProductoRepository grupoRepository;
        private final TipoProductoRepository tipoRepository;
        private final ModeloProductoRepository modeloRepository;
        private final TemporadaRepository temporadaRepository;

        public ProductoCompletoService(
                        ProductoRepository productoRepository,
                        ProductoVarianteRepository varianteRepository,
                        GrupoProductoRepository grupoRepository,
                        TipoProductoRepository tipoRepository,
                        ModeloProductoRepository modeloRepository,
                        TemporadaRepository temporadaRepository) {

                this.productoRepository = productoRepository;
                this.varianteRepository = varianteRepository;
                this.grupoRepository = grupoRepository;
                this.tipoRepository = tipoRepository;
                this.modeloRepository = modeloRepository;
                this.temporadaRepository = temporadaRepository;
        }

        @Transactional(readOnly = true)
        public String siguienteCodigo(
                        String codigoGrupo,
                        String codigoTipoProducto,
                        String codigoModelo) {

                if (codigoGrupo == null || !codigoGrupo.matches("\\d{2}")
                                || codigoTipoProducto == null
                                || !codigoTipoProducto.matches("\\d{2}")
                                || codigoModelo == null
                                || !codigoModelo.matches("\\d{2}")) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Grupo, tipo y modelo deben tener dos dígitos.");
                }

                String prefijo = codigoGrupo + codigoTipoProducto + codigoModelo;

                return productoRepository
                                .findTopByCodigoProductoStartingWithOrderByCodigoProductoDesc(prefijo)
                                .map(producto -> {
                                        String codigoProducto = producto.getCodigoProducto();

                                        int ultimo = Integer.parseInt(
                                                        codigoProducto.substring(6));

                                        if (ultimo >= 99) {
                                                throw new ResponseStatusException(
                                                                HttpStatus.CONFLICT,
                                                                "Esta combinación ya alcanzó el máximo de 99 códigos.");
                                        }

                                        return prefijo + String.format("%02d", ultimo + 1);
                                })
                                .orElse(prefijo + "01");
        }

        @Transactional
        public Producto crearPrenda(NuevaPrendaRequest request) {

                if (request.getStock() != null && request.getStock() < 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "El stock inicial no puede ser negativo.");
                }

                GrupoProducto grupo = grupoRepository
                                .findById(request.getCodigoGrupo())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "El grupo seleccionado no existe."));

                TipoProducto tipo = tipoRepository
                                .findById(request.getCodigoTipoProducto())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "El tipo de producto no existe."));

                ModeloProducto modelo = modeloRepository
                                .findById(request.getCodigoModelo())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "El modelo seleccionado no existe."));

                String prefijo = grupo.getCodigoGrupo()
                                + tipo.getCodigoTipoProducto()
                                + modelo.getCodigoModelo();

                if (!prefijo.matches("\\d{6}")) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "El grupo, tipo y modelo deben tener códigos de dos dígitos.");
                }

                String ultimoCodigo = productoRepository
                                .findTopByCodigoProductoStartingWithOrderByCodigoProductoDesc(prefijo)
                                .map(Producto::getCodigoProducto)
                                .orElse(null);

                int siguiente = 1;

                if (ultimoCodigo != null) {
                        String sufijo = ultimoCodigo.substring(6);

                        try {
                                siguiente = Integer.parseInt(sufijo) + 1;
                        } catch (NumberFormatException ex) {
                                throw new ResponseStatusException(
                                                HttpStatus.CONFLICT,
                                                "Existe un código de producto con formato incorrecto.");
                        }
                }

                if (siguiente > 99) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "Se agotaron los consecutivos para esta combinación.");
                }

                String codigo = prefijo + String.format("%02d", siguiente);

                Producto producto = new Producto();
                producto.setCodigoProducto(codigo);
                producto.setNombre(request.getNombre().trim());
                producto.setDescripcion(request.getDescripcion());
                producto.setPrecio(request.getPrecio());
                producto.setStock(request.getStock() != null ? request.getStock() : 0);
                producto.setFechaCreacion(LocalDateTime.now());
                producto.setActivo(true);
                producto.setGrupo(grupo);
                producto.setTipoProducto(tipo);
                producto.setModelo(modelo);

                if (request.getIdTemporada() != null) {
                        Temporada temporada = temporadaRepository
                                        .findById(request.getIdTemporada())
                                        .orElseThrow(() -> new ResponseStatusException(
                                                        HttpStatus.BAD_REQUEST,
                                                        "La temporada seleccionada no existe."));

                        producto.setTemporada(temporada);
                } else {
                        producto.setTemporada(null);
                }

                productoRepository.saveAndFlush(producto);

                ProductoVariante variante = new ProductoVariante();
                variante.setCodigoBarras(codigo);
                variante.setTalla(request.getTalla().trim());
                variante.setColor(request.getColor().trim());
                variante.setPrecio(request.getPrecio());
                variante.setActivo(true);
                variante.setProducto(producto);

                varianteRepository.save(variante);

                return producto;
        }

        @Transactional
        public Producto actualizarPrenda(
                        String codigoProducto,
                        NuevaPrendaRequest request) {

                Producto producto = productoRepository.findById(codigoProducto)
                                .orElseThrow(() -> new RuntimeException("Prenda no encontrada: " + codigoProducto));

                var grupo = grupoRepository.findById(request.getCodigoGrupo())
                                .orElseThrow(() -> new RuntimeException("Grupo no encontrado"));

                var tipo = tipoRepository.findById(request.getCodigoTipoProducto())
                                .orElseThrow(() -> new RuntimeException("Tipo no encontrado"));

                var modelo = modeloRepository.findById(request.getCodigoModelo())
                                .orElseThrow(() -> new RuntimeException("Modelo no encontrado"));

                producto.setGrupo(grupo);
                producto.setTipoProducto(tipo);
                producto.setModelo(modelo);
                producto.setNombre(request.getNombre());
                producto.setDescripcion(request.getDescripcion());
                producto.setPrecio(request.getPrecio());
                producto.setStock(request.getStock());

                if (request.getIdTemporada() != null) {
                        var temporada = temporadaRepository.findById(request.getIdTemporada())
                                        .orElseThrow(() -> new RuntimeException("Temporada no encontrada"));

                        producto.setTemporada(temporada);
                } else {
                        producto.setTemporada(null);
                }

                productoRepository.save(producto);

                List<ProductoVariante> variantes = varianteRepository.findByProducto_CodigoProducto(codigoProducto);

                if (variantes.isEmpty()) {
                        throw new RuntimeException(
                                        "La prenda no tiene una variante asociada");
                }

                ProductoVariante variante = variantes.get(0);
                variante.setTalla(request.getTalla());
                variante.setColor(request.getColor());
                variante.setPrecio(request.getPrecio());

                varianteRepository.save(variante);

                return producto;
        }

        @Transactional
        public void eliminarPrenda(String codigoProducto) {

                Producto producto = productoRepository.findById(codigoProducto)
                                .orElseThrow(() -> new RuntimeException("Prenda no encontrada: " + codigoProducto));

                List<ProductoVariante> variantes = varianteRepository.findByProducto_CodigoProducto(codigoProducto);

                varianteRepository.deleteAll(variantes);

                productoRepository.delete(producto);
        }
}