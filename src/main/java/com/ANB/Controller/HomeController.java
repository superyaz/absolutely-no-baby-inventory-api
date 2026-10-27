package com.ANB.Controller;

import com.ANB.Models.Service.GrupoProductoService;
import com.ANB.Models.Service.TipoProductoService;
import com.ANB.Models.Service.ModeloProductoService;
import com.ANB.Models.Service.TemporadaService;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

        private final GrupoProductoService grupoService;
        private final TipoProductoService tipoService;
        private final ModeloProductoService modeloService;
        private final TemporadaService temporadaService;

        public HomeController(
                        GrupoProductoService grupoService,
                        TipoProductoService tipoService,
                        ModeloProductoService modeloService,
                        TemporadaService temporadaService) {
                this.grupoService = grupoService;
                this.tipoService = tipoService;
                this.modeloService = modeloService;
                this.temporadaService = temporadaService;
        }

        @GetMapping("/")
        public String inicio(Model model) {
                model.addAttribute("grupos",
                                grupoService.listarActivos());

                model.addAttribute("tipos",
                                tipoService.listarActivos());

                model.addAttribute("modelos",
                                modeloService.listarActivos());

                model.addAttribute("temporadas",
                                temporadaService.listarActivas());

                return "index";
        }
}