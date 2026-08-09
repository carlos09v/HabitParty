package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserMapper;
import com.habitparty.adapters.out.persistence.repository.UserJpaRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

// É o maestro!
@Component // Faz ver que é uma injeção de dependência da implementação definida.
public class UserAdapter implements UserRepository {
  // Uso do JpaRepository
  private final UserJpaRepository userRepository;
  // Uso do Mapper (tradutor)
  private final UserMapper userMapper;

  public UserAdapter(UserJpaRepository userRepository, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;
  }

  @Override
  public User save(User user) {
    // 1. Usa o mapper para transformar o User (Domínio) em UserJpaEntity (Banco)
    UserJpaEntity entity = userMapper.toEntity(user);

    // 2. O repositório nos devolve a entidade salva (agora com possíveis campos gerados pelo banco, como createdAt).
    // Usando o JpaRepository!
    UserJpaEntity savedEntity = userRepository.save(entity);

    // 3. Usa o mapper de novo para transformar o resultado do banco de volta em Domínio e devolver.
    return userMapper.toDomain(savedEntity);
  }

  @Override
  public Optional<User> findById(UUID id) {
    // O Spring Data JPA sempre retorna um Optional<> no findById, pois o ID pode
    // não existir no banco. Se encontrar, mapeie para Domínio. Se não encontrar,
    // retorne nulo
    return userRepository.findById(id)
        .map(entity -> userMapper.toDomain(entity));
  }

  @Override
  public void deleteById(UUID id) {
    userRepository.deleteById(id);
  }

  @Override
  public List<User> findAll() {
    return userRepository.findAll().stream()
        .map(entity -> userMapper.toDomain(entity))
        .toList();
  }
}
