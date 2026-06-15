/**
 * Content Collections Configuration - Masecor Web
 *
 * Define esquemas estrictos (Zod) para las colecciones de contenido.
 * Esto garantiza que cada producto ingresado cumpla con la estructura
 * esperada, previniendo datos incompletos o inválidos.
 */

import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

/**
 * Esquema de Producto
 * Cada producto de Masecor debe cumplir con este contrato.
 */
const productSchema = z.object({
  /** Nombre comercial del producto */
  name: z.string(),
  /** Slug URL-friendly (generado automáticamente si no se provee) */
  slug: z.string().optional(),
  /** Línea o familia del producto */
  line: z.enum(['premium', 'prisma', 'standard', 'lavadero', 'accesorios']),
  /** Categoría del producto */
  category: z.enum([
    'bacha-simple',
    'bacha-doble',
    'mesada-ciega',
    'mesada-integrada',
    'pileta-lavadero',
    'accesorio',
  ]),
  /** Descripción corta para tarjetas */
  shortDescription: z.string(),
  /** Descripción completa para la página de detalle */
  description: z.string(),
  /** Medidas del producto */
  dimensions: z
    .object({
      width: z.number().optional(),
      depth: z.number().optional(),
      height: z.number().optional(),
      unit: z.enum(['mm', 'cm']).default('mm'),
    })
    .optional(),
  /** Material principal */
  material: z.string().default('Acero Inoxidable AISI 304'),
  /** Espesor del acero */
  thickness: z.string().optional(),
  /** Características destacadas */
  features: z.array(z.string()).default([]),
  /** Tipo de instalación */
  installationType: z
    .enum([
      'sobre-mueble',
      'bajo-mesada',
      'empotrar',
      'colgar',
      'sobre-mesada-bajo-mesada',
    ])
    .optional(),
  /** Imagen principal */
  image: z.string(),
  /** Imágenes adicionales */
  gallery: z.array(z.string()).default([]),
  /** Orden de aparición en el catálogo */
  sortOrder: z.number().default(0),
  /** Si el producto es nuevo o destacado */
  featured: z.boolean().default(false),
  /** Disponibilidad */
  available: z.boolean().default(true),
  /** Opciones de personalización del producto (opcional) */
  options: z
    .array(
      z.object({
        name: z.string(),
        values: z.array(z.string()),
      })
    )
    .optional(),
  /** Variaciones del producto con sus combinaciones (opcional) */
  variants: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        options: z.record(z.string(), z.string()),
        available: z.boolean().default(true),
        image: z.string().optional(),
      })
    )
    .optional(),
  /** Plano técnico o croquis de medidas del producto (opcional) */
  blueprint: z.string().optional(),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: productSchema,
});

export const collections = { products };
