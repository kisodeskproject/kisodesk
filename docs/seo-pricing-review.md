# Revisar antes de cambiar el modelo de ingresos

`front-end/lib/structuredData.ts` (`buildCourseJsonLd`) declara el JSON-LD de
cada curso con:

```ts
offers: {
  '@type': 'Offer',
  price: '0',
  priceCurrency: 'USD',
  category: 'Free',
},
```

Esto le dice a Google explícitamente que los cursos son gratuitos, lo cual
habilita el rich result de "Course" en los resultados de búsqueda.

## Por qué esto importa

Si en el futuro se introduce un modelo de ingresos que afecte el acceso a los
cursos (planes pagos, contenido premium, ads que gatean funciones, etc.), este
`price: '0'` queda desactualizado y pasa a ser información estructurada
incorrecta cara a Google — lo que puede derivar en una penalización o
desconfianza de los rich results, no solo en un dato feo.

## Qué revisar si cambia el modelo de ingresos

- Actualizar `offers` en `buildCourseJsonLd` para reflejar el precio real
  (o quitar el campo si ya no aplica a todos los cursos).
- Si solo una parte de los cursos pasa a ser paga, diferenciar el JSON-LD por
  curso en vez de usar un valor fijo para todos.
- Revisar también `isAccessibleForFree` (actualmente `true` a nivel curso) y
  el mismo campo en `buildWebApplicationJsonLd`.
