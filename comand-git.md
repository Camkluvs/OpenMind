# Guía simple: Crear rama, editar y unir

## 1. Verificar en qué rama estás

```bash
# Ver rama actual
git branch

# La rama actual aparece con asterisco (*)
```

## 2. Crear nueva rama para editar

```bash
# Crear y cambiar a nueva rama
git checkout -b mi-rama-nombre

# Verificar que cambiaste de rama
git branch
```

## 3. Hacer tus ediciones

- Edita los archivos que quieras
- Modifica HTML, CSS, etc.
- Crea nuevos archivos si necesitas

## 4. Guardar cambios en tu rama

```bash
# Ver qué archivos cambiaste
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "mis ediciones terminadas"

# Subir rama al repositorio
git push -u origin mi-rama-ediciones
```

## 5. Unir rama a la principal

```bash
# Cambiar a rama principal
git checkout main

# Verificar que estás en main
git branch

# Actualizar main
git pull origin main

# Unir tu rama
git merge mi-rama-ediciones

# Subir cambios unidos
git push origin main
```

## 6. Limpiar (opcional)

```bash
# Eliminar rama que ya no necesitas
git branch -d mi-rama-ediciones
git push origin --delete mi-rama-ediciones
```

## Comandos rápidos

```bash
# ¿En qué rama estoy?
git branch

# Crear rama
git checkout -b nombre-rama

# Cambiar de rama
git checkout nombre-rama

# Ver todas las ramas
git branch -a
```

---

**Resumen:** Crear rama → Editar → Commit → Push → Cambiar a main → Merge → Push main