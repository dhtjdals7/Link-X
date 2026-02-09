package com.linkx.controller;

import com.linkx.domain.ConnectionProfile;
import com.linkx.repository.ConnectionProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final ConnectionProfileRepository repository;

    @GetMapping
    public ResponseEntity<List<ConnectionProfile>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ConnectionProfile>> getActive() {
        return ResponseEntity.ok(repository.findByActiveTrue());
    }

    @GetMapping("/env/{env}")
    public ResponseEntity<List<ConnectionProfile>> getByEnv(@PathVariable String env) {
        return ResponseEntity.ok(repository.findByEnv(env));
    }

    @PostMapping
    public ResponseEntity<ConnectionProfile> create(@RequestBody ConnectionProfile profile) {
        return ResponseEntity.ok(repository.save(profile));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConnectionProfile> update(@PathVariable Long id, @RequestBody ConnectionProfile profile) {
        profile.setId(id);
        return ResponseEntity.ok(repository.save(profile));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
