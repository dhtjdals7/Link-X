package com.linkx.controller;

import com.linkx.domain.TelegramLayout;
import com.linkx.repository.TelegramLayoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 전문 레이아웃 관리 CRUD API
 */
@RestController
@RequestMapping("/api/layout")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LayoutController {

    private final TelegramLayoutRepository repository;

    @GetMapping
    public ResponseEntity<List<TelegramLayout>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<TelegramLayout> create(@RequestBody TelegramLayout layout) {
        return ResponseEntity.ok(repository.save(layout));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<TelegramLayout>> createBatch(@RequestBody List<TelegramLayout> layouts) {
        return ResponseEntity.ok(repository.saveAll(layouts));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TelegramLayout> update(@PathVariable Long id, @RequestBody TelegramLayout layout) {
        layout.setId(id);
        return ResponseEntity.ok(repository.save(layout));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
