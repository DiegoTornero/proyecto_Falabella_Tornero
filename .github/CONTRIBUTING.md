# Guía de Contribución

Gracias por tu interés en contribuir al Proyecto Falabella. Esta guía te ayudará a entender cómo contribuir al proyecto.

## Proceso de Contribución

1. **Fork** el repositorio
2. **Crea una rama** para tu feature: `git checkout -b feature/descripcion-feature`
3. **Realiza tus cambios** siguiendo los estándares del proyecto
4. **Commit** tus cambios: `git commit -m 'Add feature description'`
5. **Push** a tu rama: `git push origin feature/descripcion-feature`
6. **Abre un Pull Request** con una descripción clara

## Estándares de Código

### Frontend (JavaScript/TypeScript/React)

- Usar **ESLint** para linting
- Usar **Prettier** para formateo (cuando esté disponible)
- Componentes funcionales con **hooks**
- PropTypes o TypeScript para validación
- Nombres descriptivos para variables y funciones

```javascript
// ❌ Evitar
const x = (a) => a.map(i => i * 2);

// ✅ Correcto
const doubleNumbers = (numbers) => numbers.map(num => num * 2);
```

### Backend (Python)

- Seguir **PEP 8**
- Usar **black** para formateo automático
- Type hints donde sea posible
- Docstrings claros

```python
# ❌ Evitar
def process(x):
    return x * 2

# ✅ Correcto
def process_number(value: int) -> int:
    """Double the input number.
    
    Args:
        value: The number to double
        
    Returns:
        The doubled number
    """
    return value * 2
```

## Estructura de Commits

Usa commits semánticos:

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (sin cambios de lógica)
- `refactor:` - Refactorización de código
- `test:` - Agregar o actualizar tests
- `ci:` - Cambios en CI/CD

Ejemplo:
```bash
git commit -m "feat: add user authentication to core-backend"
git commit -m "fix: resolve null pointer in portal-frontend"
git commit -m "docs: update README with setup instructions"
```

## Pull Request

Cuando abras un PR:

1. **Título claro**: describe brevemente qué hace el PR
2. **Descripción**: 
   - Qué problema resuelve
   - Cambios realizados
   - Cómo testear
   - Screenshots (si aplica)
3. **Referencia a issues**: Usa `Closes #123` si cierra un issue
4. **Checklist**:
   - [ ] He testado mis cambios
   - [ ] He actualizado la documentación
   - [ ] Mi código sigue los estándares del proyecto
   - [ ] No hay conflictos con main

## Revisión de Código

Durante la revisión:

- Sé receptivo al feedback
- Responde a los comentarios
- Realiza cambios si es necesario
- Aguarda aprobación antes de mergear

## Testing

Antes de hacer commit:

### Frontend
```bash
cd core-frontend
npm run build
npm run lint  # Si está disponible

cd portal-frontend
npm run build
npm run lint
```

### Backend
```bash
cd core-backend
pytest

cd portal-backend
pytest
```

## Reportar Issues

Para reportar un bug:

1. **Verifica** que el bug no haya sido reportado
2. **Describe el problema** con claridad
3. **Pasos para reproducir**
4. **Comportamiento esperado**
5. **Comportamiento actual**
6. **Ambiente**: versión Node/Python, SO, navegador, etc.

Ejemplo:
```
**Descripción**: El formulario de login falla cuando se ingresan espacios

**Pasos para reproducir**:
1. Ir a /login
2. Ingresar " usuario@email.com " (con espacios)
3. Ingresar contraseña

**Esperado**: Debería trimear los espacios y loguear correctamente

**Actual**: Error 400 - Email inválido

**Ambiente**: Node 20.x, React 19.2, macOS
```

## Preguntas?

- Abre una **discussion** para preguntas generales
- Abre un **issue** para bugs o features
- Contacta al equipo de desarrollo

---

¡Gracias por contribuir! 🎉
