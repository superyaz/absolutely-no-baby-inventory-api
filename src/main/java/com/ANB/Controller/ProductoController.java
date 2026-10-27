package com.ANB.Controller;

import com.ANB.Models.Entity.Producto;
import com.ANB.Models.Service.ProductoService;
import com.ANB.Models.DTO.NuevaPrendaRequest;
import com.ANB.Models.DTO.PrendaEdicionDTO;
import com.ANB.Models.Service.ProductoCompletoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import com.ANB.Models.Entity.ProductoVariante;
import com.ANB.Models.Repository.ProductoVarianteRepository;
import com.ANB.Models.Entity.GrupoProducto;
import com.ANB.Models.Entity.TipoProducto;
import com.ANB.Models.Repository.GrupoProductoRepository;
import com.ANB.Models.Repository.TipoProductoRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {
    private final ProductoService service;
    private final ProductoCompletoService productoCompletoService;
    private final ProductoVarianteRepository varianteRepository;
    private final GrupoProductoRepository grupoRepository;
    private final TipoProductoRepository tipoProductoRepository;

    public ProductoController(ProductoService service, ProductoCompletoService productoCompletoService,
            ProductoVarianteRepository varianteRepository, GrupoProductoRepository grupoRepository,
            TipoProductoRepository tipoProductoRepository) {
        this.service = service;
        this.productoCompletoService = productoCompletoService;
        this.varianteRepository = varianteRepository;
        this.grupoRepository = grupoRepository;
        this.tipoProductoRepository = tipoProductoRepository;
    }

    @GetMapping
    public List<Producto> listar() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Producto obtener(@PathVariable String id) {
        return service.findById(id);
    }

    @GetMapping("/grupos")
    public List<GrupoProducto> listarGruposActivos() {
        return grupoRepository.findByActivoTrueOrderByCodigoGrupoAsc();
    }

    @GetMapping("/tipos")
    public List<TipoProducto> listarTiposActivos() {
        return tipoProductoRepository.findByActivoTrueOrderByCodigoTipoProductoAsc();
    }

    @PostMapping("/crear-completo")
    public ResponseEntity<Producto> crearCompleto(
            @Valid @RequestBody NuevaPrendaRequest request) {

        Producto producto = productoCompletoService.crearPrenda(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(producto);
    }

    @GetMapping("/siguiente-codigo")
    public Map<String, String> siguienteCodigo(
            @RequestParam String grupo,
            @RequestParam String tipo,
            @RequestParam String modelo) {

        String codigo = productoCompletoService.siguienteCodigo(
                grupo, tipo, modelo);

        return Map.of("codigoProducto", codigo);
    }

    @GetMapping("/inventario")
    public List<Map<String, Object>> listarInventario() {

        List<Producto> productos = service.findAll();

        List<ProductoVariante> variantes = varianteRepository.findAll();

        Map<String, List<ProductoVariante>> variantesPorProducto = variantes.stream()
                .filter(v -> v.getProducto() != null)
                .filter(v -> !Boolean.FALSE.equals(v.getActivo()))
                .collect(Collectors.groupingBy(
                        v -> v.getProducto().getCodigoProducto()));

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Producto producto : productos) {

            if (Boolean.FALSE.equals(producto.getActivo())) {
                continue;
            }

            List<ProductoVariante> variantesProducto = variantesPorProducto.get(producto.getCodigoProducto());

            if (variantesProducto == null || variantesProducto.isEmpty()) {
                variantesProducto = java.util.Collections.singletonList(null);
            }

            for (ProductoVariante variante : variantesProducto) {

                Map<String, Object> fila = new HashMap<>();

                fila.put("codigoProducto", producto.getCodigoProducto());
                fila.put("nombre", producto.getNombre());
                fila.put(
                        "grupo",
                        producto.getGrupo() == null
                                ? ""
                                : producto.getGrupo().getNombre());

                fila.put(
                        "tipo",
                        producto.getTipoProducto() == null
                                ? ""
                                : producto.getTipoProducto().getNombre());
                fila.put("stock", producto.getStock() == null ? 0 : producto.getStock());
                fila.put(
                        "temporada",
                        producto.getTemporada() == null
                                ? "Sin temporada"
                                : producto.getTemporada().getNombre());

                fila.put(
                        "talla",
                        variante == null ? "" : variante.getTalla());

                fila.put(
                        "color",
                        variante == null ? "" : variante.getColor());

                resultado.add(fila);
            }
        }

        return resultado;
    }

    @PostMapping
    public ResponseEntity<Producto> crear(@Valid @RequestBody Producto entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(entity));
    }

    @GetMapping("/{id}/edicion")
    public ResponseEntity<PrendaEdicionDTO> obtenerDatosEdicion(
            @PathVariable String id) {

        Producto producto = service.findById(id);

        List<ProductoVariante> variantes = varianteRepository.findByProducto_CodigoProducto(id);

        ProductoVariante variante = variantes.stream()
                .filter(v -> !Boolean.FALSE.equals(v.getActivo()))
                .findFirst()
                .orElse(variantes.isEmpty() ? null : variantes.get(0));

        PrendaEdicionDTO dto = new PrendaEdicionDTO();

        dto.setCodigoProducto(producto.getCodigoProducto());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setStock(producto.getStock());

        dto.setCodigoGrupo(
                producto.getGrupo() != null
                        ? producto.getGrupo().getCodigoGrupo()
                        : null);

        dto.setCodigoTipoProducto(
                producto.getTipoProducto() != null
                        ? producto.getTipoProducto().getCodigoTipoProducto()
                        : null);

        dto.setCodigoModelo(
                producto.getModelo() != null
                        ? producto.getModelo().getCodigoModelo()
                        : null);

        dto.setIdTemporada(
                producto.getTemporada() != null
                        ? producto.getTemporada().getIdTemporada()
                        : null);

        if (variante != null) {
            dto.setTalla(variante.getTalla());
            dto.setColor(variante.getColor());
        }

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/completo")
    public ResponseEntity<Producto> actualizarPrenda(
            @PathVariable String id,
            @Valid @RequestBody NuevaPrendaRequest request) {

        Producto actualizado = productoCompletoService.actualizarPrenda(id, request);

        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPrenda(@PathVariable String id) {

        productoCompletoService.eliminarPrenda(id);

        return ResponseEntity.noContent().build();
    }
}
