export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de errores
        'docs',     // Documentación
        'style',    // Formateo, sin cambios de lógica
        'refactor', // Refactorización de código
        'perf',     // Mejoras de rendimiento
        'test',     // Tests
        'chore',    // Mantenimiento
        'ci',       // Integración continua
        'build',    // Sistema de build
        'revert',   // Revertir cambios
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-max-length': [2, 'always', 72],
  },
};
